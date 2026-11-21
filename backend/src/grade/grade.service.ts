import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, QueryTypes, type Includeable, type Order, type WhereOptions } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { Grade } from './grade.model.js';
import { Student } from '../student/student.model.js';
import { User } from '../user/user.model.js';
import { Teacher } from '../teacher/teacher.model.js';
import { Subject } from '../subject/subject.model.js';
import { SchoolClass } from '../school-class/school-class.model.js';
import { TeacherSubjectClass } from '../teacher-subject-class/teacher-subject-class.model.js';
import { JournalAccessService } from '../journal-access/journal-access.service.js';
import { GradeType } from '../common/enums/grade-type.enum.js';
import { Role } from '../common/enums/role.enum.js';
import { CreateGradeDto } from './dto/create-grade.dto.js';
import { UpdateGradeDto } from './dto/update-grade.dto.js';
import { GradeQueryDto } from './dto/grade-query.dto.js';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface.js';

export interface GradePage {
  items: Grade[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

/** Средний балл по одному предмету */
export interface SubjectAverage {
  subject_id: number;
  subject_name: string;
  average: number | null;
  grades_count: number;
  total_weight: number;
}

/** Средние баллы одного ученика */
export interface StudentAverage {
  student_id: number;
  student_name: string;
  class_name: string | null;
  subjects: SubjectAverage[];
}

/** Строка результата SQL-агрегации (PostgreSQL возвращает числа строками) */
interface AverageRow {
  student_id: number;
  subject_id: number;
  subject_name: string;
  average: string | null;
  grades_count: string;
  total_weight: string;
}

/**
 * Вес оценки зависит от типа работы: контрольная влияет на средний балл
 * сильнее обычного ответа. Вес задаёт сервер, а не клиент.
 */
const GRADE_WEIGHT: Record<GradeType, number> = {
  [GradeType.Lesson]: 1,
  [GradeType.Homework]: 1,
  [GradeType.Project]: 2,
  [GradeType.Test]: 3,
};

/** Что подтягиваем вместе с оценкой: ученик, предмет, класс, кто поставил */
const GRADE_INCLUDE: Includeable[] = [
  {
    model: Student,
    as: 'student',
    attributes: ['id'],
    required: false,
    include: [{ model: User, as: 'user', attributes: ['lastname', 'firstname', 'middlename'] }],
  },
  {
    model: TeacherSubjectClass,
    as: 'assignment',
    attributes: ['id'],
    required: false,
    include: [
      { model: Subject, as: 'subject', attributes: ['id', 'name'] },
      { model: SchoolClass, as: 'schoolClass', attributes: ['id', 'name', 'academic_year'] },
    ],
  },
  {
    model: Teacher,
    as: 'createdByTeacher',
    attributes: ['id'],
    required: false,
    include: [{ model: User, as: 'user', attributes: ['lastname', 'firstname', 'middlename'] }],
  },
];

@Injectable()
export class GradeService {
  constructor(
    @InjectModel(Grade) private readonly gradeModel: typeof Grade,
    private readonly access: JournalAccessService,
    private readonly sequelize: Sequelize,
  ) {}

  /**
   * Список оценок. Один маршрут — три сценария:
   * Учитель — оценки по своим назначениям, Ученик — только свои,
   * Родитель — только своих детей.
   */
  async findAll(user: JwtPayload, query: GradeQueryDto): Promise<GradePage> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const where = await this.buildWhere(user, query);
    const order = this.buildOrder(query.sort);

    const { rows, count } = await this.gradeModel.findAndCountAll({
      where,
      include: GRADE_INCLUDE,
      order,
      limit,
      offset: (page - 1) * limit,
      distinct: true,
    });

    return { items: rows, total: count, page, limit, pages: Math.ceil(count / limit) };
  }

  /** Оценка по id с проверкой права её видеть */
  async findOne(user: JwtPayload, id: number): Promise<Grade> {
    const grade = await this.gradeModel.findByPk(id, { include: GRADE_INCLUDE });
    if (!grade) {
      throw new NotFoundException(`Оценка с id=${id} не найдена`);
    }
    await this.assertCanRead(user, grade);
    return grade;
  }

  /** Учитель ставит оценку. Автор берётся из токена, вес — из типа работы */
  async create(user: JwtPayload, dto: CreateGradeDto): Promise<Grade> {
    // Учитель может работать только со своим назначением
    await this.access.assertTeacherOwnsAssignment(user, dto.assignment_id);
    // Ученик должен учиться в классе этого назначения
    await this.access.assertStudentInAssignmentClass(dto.student_id, dto.assignment_id);

    const gradeType = dto.grade_type ?? GradeType.Lesson;
    const teacherId = await this.access.teacherIdOf(user);

    const created = await this.gradeModel.create({
      student_id: dto.student_id,
      assignment_id: dto.assignment_id,
      value: dto.value,
      lesson_date: dto.lesson_date,
      grade_type: gradeType,
      weight: GRADE_WEIGHT[gradeType],
      comment: dto.comment ?? null,
      created_by: teacherId,
    });

    return this.findOne(user, created.id);
  }

  /** Изменение оценки: только учитель своего назначения */
  async update(user: JwtPayload, id: number, dto: UpdateGradeDto): Promise<Grade> {
    const grade = await this.gradeModel.findByPk(id);
    if (!grade) {
      throw new NotFoundException(`Оценка с id=${id} не найдена`);
    }
    await this.access.assertTeacherOwnsAssignment(user, grade.assignment_id);

    if (dto.assignment_id !== undefined && dto.assignment_id !== grade.assignment_id) {
      await this.access.assertTeacherOwnsAssignment(user, dto.assignment_id);
    }
    // Проверяем итоговую пару «ученик + назначение»
    await this.access.assertStudentInAssignmentClass(
      dto.student_id ?? grade.student_id,
      dto.assignment_id ?? grade.assignment_id,
    );

    const gradeType = dto.grade_type ?? grade.grade_type;

    await grade.update({
      student_id: dto.student_id ?? grade.student_id,
      assignment_id: dto.assignment_id ?? grade.assignment_id,
      value: dto.value ?? grade.value,
      lesson_date: dto.lesson_date ?? grade.lesson_date,
      grade_type: gradeType,
      weight: GRADE_WEIGHT[gradeType], // вес всегда соответствует типу работы
      comment: dto.comment ?? grade.comment,
    });

    return this.findOne(user, id);
  }

  /** Удаление оценки */
  async remove(user: JwtPayload, id: number): Promise<{ message: string }> {
    const grade = await this.gradeModel.findByPk(id);
    if (!grade) {
      throw new NotFoundException(`Оценка с id=${id} не найдена`);
    }
    await this.access.assertTeacherOwnsAssignment(user, grade.assignment_id);
    await grade.destroy();
    return { message: `Оценка с id=${id} удалена` };
  }

  /**
   * 🔑 Ключевая функция: взвешенный средний балл по предметам.
   * Считается одним SQL-запросом: SUM(value * weight) / SUM(weight).
   * Если student_id не передан: ученик получает себя, родитель — всех своих детей.
   */
  async average(user: JwtPayload, studentId?: number): Promise<StudentAverage[]> {
    let ids: number[];

    if (studentId !== undefined) {
      ids = [await this.access.resolveStudentId(user, studentId)];
    } else if (user.role === Role.Teacher) {
      throw new BadRequestException('Укажите идентификатор ученика (student_id)');
    } else {
      const allowed = await this.access.readableStudentIds(user);
      ids = allowed ?? [];
    }

    if (ids.length === 0) {
      return [];
    }

    const rows = await this.sequelize.query<AverageRow>(
      `SELECT g.student_id,
              sub.id   AS subject_id,
              sub.name AS subject_name,
              ROUND(SUM(g.value * g.weight)::numeric / NULLIF(SUM(g.weight), 0), 2) AS average,
              COUNT(*) AS grades_count,
              SUM(g.weight) AS total_weight
       FROM grade g
       JOIN teacher_subject_class a ON a.id = g.assignment_id
       JOIN subject sub ON sub.id = a.subject_id
       WHERE g.student_id IN (:ids)
       GROUP BY g.student_id, sub.id, sub.name
       ORDER BY g.student_id, sub.name`,
      { replacements: { ids }, type: QueryTypes.SELECT },
    );

    const students = await this.access.studentsByIds(ids);

    return students.map((student) => {
      const subjects: SubjectAverage[] = rows
        .filter((row) => row.student_id === student.id)
        .map((row) => ({
          subject_id: row.subject_id,
          subject_name: row.subject_name,
          average: row.average === null ? null : Number(row.average),
          grades_count: Number(row.grades_count),
          total_weight: Number(row.total_weight),
        }));

      return {
        student_id: student.id,
        student_name: this.fullName(student),
        class_name: student.schoolClass
          ? `${student.schoolClass.name} (${student.schoolClass.academic_year})`
          : null,
        subjects,
      };
    });
  }

  // ---------- Вспомогательные методы ----------

  /** Условия выборки с учётом роли */
  private async buildWhere(user: JwtPayload, query: GradeQueryDto): Promise<WhereOptions> {
    const conditions: WhereOptions[] = [];

    if (user.role === Role.Teacher) {
      const assignmentIds = await this.access.teacherAssignmentIds(user);
      // Назначений нет — оценок учитель не видит (пустой список, а не ошибка)
      conditions.push({ assignment_id: { [Op.in]: assignmentIds } });
    } else {
      const studentIds = (await this.access.readableStudentIds(user)) ?? [];
      conditions.push({ student_id: { [Op.in]: studentIds } });
    }

    if (query.student_id !== undefined) {
      conditions.push({ student_id: query.student_id });
    }
    if (query.assignment_id !== undefined) {
      conditions.push({ assignment_id: query.assignment_id });
    }
    if (query.grade_type !== undefined) {
      conditions.push({ grade_type: query.grade_type });
    }
    if (query.date_from && query.date_to) {
      conditions.push({ lesson_date: { [Op.between]: [query.date_from, query.date_to] } });
    } else if (query.date_from) {
      conditions.push({ lesson_date: { [Op.gte]: query.date_from } });
    } else if (query.date_to) {
      conditions.push({ lesson_date: { [Op.lte]: query.date_to } });
    }

    return { [Op.and]: conditions };
  }

  private buildOrder(sort?: string): Order {
    switch (sort) {
      case 'date_asc':
        return [
          ['lesson_date', 'ASC'],
          ['id', 'ASC'],
        ];
      case 'value_desc':
        return [
          ['value', 'DESC'],
          ['id', 'ASC'],
        ];
      case 'value_asc':
        return [
          ['value', 'ASC'],
          ['id', 'ASC'],
        ];
      default:
        return [
          ['lesson_date', 'DESC'],
          ['id', 'DESC'],
        ];
    }
  }

  /** Право читать конкретную оценку */
  private async assertCanRead(user: JwtPayload, grade: Grade): Promise<void> {
    if (user.role === Role.Teacher) {
      const assignmentIds = await this.access.teacherAssignmentIds(user);
      if (!assignmentIds.includes(grade.assignment_id)) {
        throw new NotFoundException(`Оценка с id=${grade.id} не найдена`);
      }
      return;
    }
    await this.access.assertCanViewStudent(user, grade.student_id);
  }

  /** ФИО из подключённой учётной записи */
  private fullName(student: Student): string {
    const user = student.user;
    if (!user) {
      return `Ученик №${student.id}`;
    }
    return [user.lastname, user.firstname, user.middlename].filter(Boolean).join(' ');
  }
}