import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import ExcelJS from 'exceljs';
import { Student } from '../student/student.model.js';
import { User } from '../user/user.model.js';
import { SchoolClass } from '../school-class/school-class.model.js';
import { Subject } from '../subject/subject.model.js';
import { TeacherSubjectClass } from '../teacher-subject-class/teacher-subject-class.model.js';
import { Grade } from '../grade/grade.model.js';
import { JournalAccessService } from '../journal-access/journal-access.service.js';
import { GradeType } from '../common/enums/grade-type.enum.js';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface.js';
import type { ImportResultDto, ImportRowError } from './dto/import-result.dto.js';

/** Вес оценки по типу работы — как в модуле оценок */
const GRADE_WEIGHT: Record<GradeType, number> = {
  [GradeType.Lesson]: 1,
  [GradeType.Homework]: 1,
  [GradeType.Project]: 2,
  [GradeType.Test]: 3,
};

/** Заголовок таблицы → внутреннее имя поля */
const HEADER_MAP: Record<string, string> = {
  'фамилия': 'lastname',
  'имя': 'firstname',
  'отчество': 'middlename',
  'класс': 'class',
  'предмет': 'subject',
  'дата': 'date',
  'тип работы': 'type',
  'оценка': 'value',
  'комментарий': 'comment',
};

const REQUIRED = ['lastname', 'firstname', 'class', 'subject', 'date', 'type', 'value'];

/** Одна разобранная строка */
interface ParsedRow {
  row: number;
  student: string;
  lastname: string;
  firstname: string;
  middlename: string;
  className: string;
  subjectName: string;
  date: string;
  gradeType: GradeType;
  value: number;
  comment: string | null;
}

@Injectable()
export class ImportService {
  constructor(
    @InjectModel(Student) private readonly studentModel: typeof Student,
    @InjectModel(SchoolClass) private readonly classModel: typeof SchoolClass,
    @InjectModel(Subject) private readonly subjectModel: typeof Subject,
    @InjectModel(TeacherSubjectClass) private readonly assignmentModel: typeof TeacherSubjectClass,
    @InjectModel(Grade) private readonly gradeModel: typeof Grade,
    private readonly access: JournalAccessService,
    private readonly sequelize: Sequelize,
  ) {}

  async importGrades(
    user: JwtPayload,
    file: Express.Multer.File,
    academicYear: number,
  ): Promise<ImportResultDto> {
    const teacherId = await this.access.teacherIdOf(user);
    const rows = await this.readRows(file.buffer);
    if (rows.length === 0) {
      throw new BadRequestException('В таблице нет строк с данными');
    }

    const errors: ImportRowError[] = [];
    const valid: { studentId: number; assignmentId: number; data: ParsedRow }[] = [];

    for (const row of rows) {
      const result = await this.validateRow(row, teacherId, academicYear);
      if ('errors' in result) {
        errors.push({ row: row.row, student: row.student, message: result.errors.join('; ') });
      } else {
        valid.push({ studentId: result.studentId, assignmentId: result.assignmentId, data: row });
      }
    }

    // Если хотя бы одна строка неверна — не сохраняем ничего
    if (errors.length > 0) {
      throw new BadRequestException({
        statusCode: 400,
        message: `Импорт отменён: ошибок в строках — ${errors.length}`,
        errors,
      });
    }

    // Все строки верны — сохраняем в одной транзакции
    await this.sequelize.transaction(async (t) => {
      for (const item of valid) {
        await this.gradeModel.create(
          {
            student_id: item.studentId,
            assignment_id: item.assignmentId,
            value: item.data.value,
            lesson_date: item.data.date,
            grade_type: item.data.gradeType,
            weight: GRADE_WEIGHT[item.data.gradeType],
            comment: item.data.comment,
            created_by: teacherId,
          },
          { transaction: t },
        );
      }
    });

    return { imported: valid.length, academic_year: academicYear };
  }

  // ---------- Разбор таблицы ----------

  private async readRows(buffer: Buffer): Promise<ParsedRow[]> {
    const workbook = new ExcelJS.Workbook();
    try {
      await workbook.xlsx.load(buffer as unknown as Parameters<typeof workbook.xlsx.load>[0]);
    } catch {
      throw new BadRequestException('Не удалось прочитать файл: ожидается книга Excel (.xlsx)');
    }
    const sheet = workbook.worksheets[0];
    if (!sheet) {
      throw new BadRequestException('В книге нет листов');
    }

    const columns = this.parseHeader(sheet.getRow(1));
    const rows: ParsedRow[] = [];

    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // заголовок
      const get = (field: string): ExcelJS.CellValue => {
        const col = columns[field];
        return col ? row.getCell(col).value : null;
      };
      const lastname = this.asString(get('lastname'));
      const firstname = this.asString(get('firstname'));
      if (!lastname && !firstname) return; // пустая строка

      rows.push({
        row: rowNumber,
        student: [lastname, firstname, this.asString(get('middlename'))].filter(Boolean).join(' '),
        lastname,
        firstname,
        middlename: this.asString(get('middlename')),
        className: this.asString(get('class')),
        subjectName: this.asString(get('subject')),
        date: this.asDate(get('date')),
        gradeType: this.asString(get('type')) as GradeType,
        value: Number(this.asString(get('value'))),
        comment: this.asString(get('comment')) || null,
      });
    });

    return rows;
  }

  private parseHeader(row: ExcelJS.Row): Record<string, number> {
    const columns: Record<string, number> = {};
    row.eachCell((cell, colNumber) => {
      const key = HEADER_MAP[this.asString(cell.value).toLowerCase()];
      if (key) columns[key] = colNumber;
    });
    const missing = REQUIRED.filter((field) => !columns[field]);
    if (missing.length > 0) {
      const names = Object.entries(HEADER_MAP)
        .filter(([, field]) => missing.includes(field))
        .map(([header]) => header);
      throw new BadRequestException(`В таблице не хватает колонок: ${names.join(', ')}`);
    }
    return columns;
  }

  // ---------- Проверка одной строки ----------

  private async validateRow(
    row: ParsedRow,
    teacherId: number,
    year: number,
  ): Promise<{ studentId: number; assignmentId: number } | { errors: string[] }> {
    const errors: string[] = [];

    if (!row.lastname) errors.push('не указана фамилия');
    if (!row.firstname) errors.push('не указано имя');
    if (!row.className) errors.push('не указан класс');
    if (!row.subjectName) errors.push('не указан предмет');
    if (!row.date) errors.push('дата пустая или не в формате ГГГГ-ММ-ДД');
    if (!Object.values(GradeType).includes(row.gradeType)) {
      errors.push(`неизвестный тип работы «${row.gradeType}»`);
    }
    if (!Number.isInteger(row.value) || row.value < 1 || row.value > 5) {
      errors.push('оценка должна быть целым числом от 1 до 5');
    }
    if (errors.length > 0) return { errors };

    // Класс + учебный год
    const schoolClass = await this.classModel.findOne({
      where: { name: row.className, academic_year: year },
    });
    if (!schoolClass) {
      return { errors: [`класс «${row.className}» за ${year} год не найден`] };
    }

    // Ученик по ФИО в этом классе
    const students = await this.studentModel.findAll({
      where: { class_id: schoolClass.id },
      include: [{ model: User, as: 'user', attributes: ['lastname', 'firstname', 'middlename'] }],
    });
    const student = students.find((s) => {
      const u = s.user;
      return (
        u &&
        u.lastname === row.lastname &&
        u.firstname === row.firstname &&
        (row.middlename === '' || (u.middlename ?? '') === row.middlename)
      );
    });
    if (!student) {
      return { errors: [`ученик «${row.student}» не найден в классе ${row.className}`] };
    }

    // Предмет
    const subject = await this.subjectModel.findOne({ where: { name: row.subjectName } });
    if (!subject) {
      return { errors: [`предмет «${row.subjectName}» не найден`] };
    }

    // Назначение: этот учитель ведёт этот предмет в этом классе?
    const assignment = await this.assignmentModel.findOne({
      where: { teacher_id: teacherId, subject_id: subject.id, class_id: schoolClass.id },
    });
    if (!assignment) {
      return { errors: [`вы не ведёте «${row.subjectName}» в классе ${row.className}`] };
    }

    return { studentId: student.id, assignmentId: assignment.id };
  }

  // ---------- Преобразование значений ячеек ----------

  private asString(value: ExcelJS.CellValue): string {
    if (value === null || value === undefined) return '';
    if (value instanceof Date) return this.asDate(value);
    if (typeof value === 'object') {
      // Гиперссылка: берём видимый текст
      if ('text' in value) return String(value.text).trim();
      // Формула: результат может быть числом, строкой, датой или ошибкой (#Н/Д).
      // Разбираем его тем же методом, а не String() — иначе получим [object Object]
      if ('result' in value) return this.asString(value.result ?? null);
      // Форматированный текст: склеиваем фрагменты
      if ('richText' in value) return value.richText.map((t) => t.text).join('').trim();
      // Ячейка с ошибкой формулы — считаем значение пустым,
      // дальше строку забракует валидация с понятным сообщением
      return '';
    }
    return String(value).trim();
  }
  private asDate(value: ExcelJS.CellValue): string {
    if (value instanceof Date) {
      return value.toISOString().slice(0, 10);
    }
    const text = this.asString(value);
    return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : '';
  }
}