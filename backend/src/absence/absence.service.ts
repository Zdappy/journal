import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, type Includeable, type Order, type WhereOptions } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { Absence } from './absence.model.js';
import { Student } from '../student/student.model.js';
import { User } from '../user/user.model.js';
import { Teacher } from '../teacher/teacher.model.js';
import { Subject } from '../subject/subject.model.js';
import { SchoolClass } from '../school-class/school-class.model.js';
import { TeacherSubjectClass } from '../teacher-subject-class/teacher-subject-class.model.js';
import { JournalAccessService } from '../journal-access/journal-access.service.js';
import { AbsenceType } from '../common/enums/absence-type.enum.js';
import { Role } from '../common/enums/role.enum.js';
import { CreateAbsenceDto } from './dto/create-absence.dto.js';
import { UpdateAbsenceDto } from './dto/update-absence.dto.js';
import { AbsenceQueryDto } from './dto/absence-query.dto.js';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface.js';

export interface AbsencePage {
  items: Absence[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

/** Сводка по пропускам одного ученика */
export interface AbsenceSummary {
  student_id: number;
  total: number;
  by_type: Record<AbsenceType, number>;
}

interface SummaryRow {
  student_id: number;
  absence_type: AbsenceType;
  count: string;
}

const ABSENCE_INCLUDE: Includeable[] = [
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
export class AbsenceService {
  constructor(
    @InjectModel(Absence) private readonly absenceModel: typeof Absence,
    private readonly access: JournalAccessService,
    private readonly sequelize: Sequelize,
  ) {}

  async findAll(user: JwtPayload, query: AbsenceQueryDto): Promise<AbsencePage> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const where = await this.buildWhere(user, query);
    const order: Order =
      query.sort === 'date_asc'
        ? [['lesson_date', 'ASC'], ['id', 'ASC']]
        : [['lesson_date', 'DESC'], ['id', 'DESC']];

    const { rows, count } = await this.absenceModel.findAndCountAll({
      where,
      include: ABSENCE_INCLUDE,
      order,
      limit,
      offset: (page - 1) * limit,
      distinct: true,
    });

    return { items: rows, total: count, page, limit, pages: Math.ceil(count / limit) };
  }

  async findOne(user: JwtPayload, id: number): Promise<Absence> {
    const absence = await this.absenceModel.findByPk(id, { include: ABSENCE_INCLUDE });
    if (!absence) {
      throw new NotFoundException(`Пропуск с id=${id} не найден`);
    }
    await this.assertCanRead(user, absence);
    return absence;
  }

  /** Отметить пропуск. Повторная отметка на ту же дату запрещена (409) */
  async create(user: JwtPayload, dto: CreateAbsenceDto): Promise<Absence> {
    await this.access.assertTeacherOwnsAssignment(user, dto.assignment_id);
    await this.access.studentById(dto.student_id);
    const teacherId = await this.access.teacherIdOf(user);

    const created = await this.absenceModel.create({
      student_id: dto.student_id,
      assignment_id: dto.assignment_id,
      lesson_date: dto.lesson_date,
      absence_type: dto.absence_type ?? AbsenceType.Invalid,
      reason: dto.reason ?? null,
      created_by: teacherId,
    });

    return this.findOne(user, created.id);
  }

  async update(user: JwtPayload, id: number, dto: UpdateAbsenceDto): Promise<Absence> {
    const absence = await this.absenceModel.findByPk(id);
    if (!absence) {
      throw new NotFoundException(`Пропуск с id=${id} не найден`);
    }
    await this.access.assertTeacherOwnsAssignment(user, absence.assignment_id);

    if (dto.assignment_id !== undefined && dto.assignment_id !== absence.assignment_id) {
      await this.access.assertTeacherOwnsAssignment(user, dto.assignment_id);
    }
    if (dto.student_id !== undefined) {
      await this.access.studentById(dto.student_id);
    }

    await absence.update({
      student_id: dto.student_id ?? absence.student_id,
      assignment_id: dto.assignment_id ?? absence.assignment_id,
      lesson_date: dto.lesson_date ?? absence.lesson_date,
      absence_type: dto.absence_type ?? absence.absence_type,
      reason: dto.reason ?? absence.reason,
    });

    return this.findOne(user, id);
  }

  async remove(user: JwtPayload, id: number): Promise<{ message: string }> {
    const absence = await this.absenceModel.findByPk(id);
    if (!absence) {
      throw new NotFoundException(`Пропуск с id=${id} не найден`);
    }
    await this.access.assertTeacherOwnsAssignment(user, absence.assignment_id);
    await absence.destroy();
    return { message: `Пропуск с id=${id} удалён` };
  }

  /** Сводка по пропускам: всего и по каждому типу */
  async summary(user: JwtPayload, studentId?: number): Promise<AbsenceSummary[]> {
    let ids: number[];

    if (studentId !== undefined) {
      ids = [await this.access.resolveStudentId(user, studentId)];
    } else if (user.role === Role.Teacher) {
      throw new BadRequestException('Укажите идентификатор ученика (student_id)');
    } else {
      ids = (await this.access.readableStudentIds(user)) ?? [];
    }

    if (ids.length === 0) {
      return [];
    }

    const rows = await this.sequelize.query<SummaryRow>(
      `SELECT student_id, absence_type, COUNT(*) AS count
       FROM absence
       WHERE student_id IN (:ids)
       GROUP BY student_id, absence_type`,
      { replacements: { ids }, type: 'SELECT' as never },
    );

    return ids.map((id) => {
      const byType = {
        [AbsenceType.Illness]: 0,
        [AbsenceType.Valid]: 0,
        [AbsenceType.Invalid]: 0,
        [AbsenceType.Lateness]: 0,
      } as Record<AbsenceType, number>;

      let total = 0;
      for (const row of rows.filter((r) => r.student_id === id)) {
        const count = Number(row.count);
        byType[row.absence_type] = count;
        total += count;
      }

      return { student_id: id, total, by_type: byType };
    });
  }

  // ---------- Вспомогательные методы ----------

  private async buildWhere(user: JwtPayload, query: AbsenceQueryDto): Promise<WhereOptions> {
    const conditions: WhereOptions[] = [];

    if (user.role === Role.Teacher) {
      conditions.push({ assignment_id: { [Op.in]: await this.access.teacherAssignmentIds(user) } });
    } else {
      conditions.push({ student_id: { [Op.in]: (await this.access.readableStudentIds(user)) ?? [] } });
    }

    if (query.student_id !== undefined) conditions.push({ student_id: query.student_id });
    if (query.assignment_id !== undefined) conditions.push({ assignment_id: query.assignment_id });
    if (query.absence_type !== undefined) conditions.push({ absence_type: query.absence_type });

    if (query.date_from && query.date_to) {
      conditions.push({ lesson_date: { [Op.between]: [query.date_from, query.date_to] } });
    } else if (query.date_from) {
      conditions.push({ lesson_date: { [Op.gte]: query.date_from } });
    } else if (query.date_to) {
      conditions.push({ lesson_date: { [Op.lte]: query.date_to } });
    }

    return { [Op.and]: conditions };
  }

  private async assertCanRead(user: JwtPayload, absence: Absence): Promise<void> {
    if (user.role === Role.Teacher) {
      const ids = await this.access.teacherAssignmentIds(user);
      if (!ids.includes(absence.assignment_id)) {
        throw new NotFoundException(`Пропуск с id=${absence.id} не найден`);
      }
      return;
    }
    await this.access.assertCanViewStudent(user, absence.student_id);
  }
}