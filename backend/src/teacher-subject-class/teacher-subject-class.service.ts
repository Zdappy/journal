import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { type Includeable, type Order } from 'sequelize';
import { TeacherSubjectClass } from './teacher-subject-class.model.js';
import { Teacher } from '../teacher/teacher.model.js';
import { User } from '../user/user.model.js';
import { Subject } from '../subject/subject.model.js';
import { SchoolClass } from '../school-class/school-class.model.js';
import { Grade } from '../grade/grade.model.js';
import { Absence } from '../absence/absence.model.js';
import { CreateAssignmentDto } from './dto/create-assignment.dto.js';
import { AssignmentQueryDto } from './dto/assignment-query.dto.js';

export interface AssignmentPage {
  items: TeacherSubjectClass[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

/** Что подтягиваем вместе с назначением: ФИО учителя, предмет, класс */
const ASSIGNMENT_INCLUDE: Includeable[] = [
  {
    model: Teacher,
    as: 'teacher',
    attributes: ['id'],
    required: false,
    include: [
      { model: User, as: 'user', attributes: ['lastname', 'firstname', 'middlename'] },
    ],
  },
  { model: Subject, as: 'subject', attributes: ['id', 'name'], required: false },
  {
    model: SchoolClass,
    as: 'schoolClass',
    attributes: ['id', 'name', 'academic_year'],
    required: false,
  },
];

@Injectable()
export class TeacherSubjectClassService {
  constructor(
    @InjectModel(TeacherSubjectClass)
    private readonly assignmentModel: typeof TeacherSubjectClass,
    @InjectModel(Teacher) private readonly teacherModel: typeof Teacher,
    @InjectModel(Subject) private readonly subjectModel: typeof Subject,
    @InjectModel(SchoolClass) private readonly classModel: typeof SchoolClass,
    @InjectModel(Grade) private readonly gradeModel: typeof Grade,
    @InjectModel(Absence) private readonly absenceModel: typeof Absence,
  ) {}

  /** Список назначений с фильтрами и постраничным выводом */
  async findAll(query: AssignmentQueryDto): Promise<AssignmentPage> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const order: Order = query.sort === 'id_desc' ? [['id', 'DESC']] : [['id', 'ASC']];

    const { rows, count } = await this.assignmentModel.findAndCountAll({
      where: {
        ...(query.teacher_id ? { teacher_id: query.teacher_id } : {}),
        ...(query.subject_id ? { subject_id: query.subject_id } : {}),
        ...(query.class_id ? { class_id: query.class_id } : {}),
      },
      include: ASSIGNMENT_INCLUDE,
      order,
      limit,
      offset: (page - 1) * limit,
      distinct: true,
    });

    return { items: rows, total: count, page, limit, pages: Math.ceil(count / limit) };
  }

  async findOne(id: number): Promise<TeacherSubjectClass> {
    const assignment = await this.assignmentModel.findByPk(id, {
      include: ASSIGNMENT_INCLUDE,
    });
    if (!assignment) {
      throw new NotFoundException(`Назначение с id=${id} не найдено`);
    }
    return assignment;
  }

  /** Назначения текущего учителя — берём teacher_id из токена, а не из запроса */
  async findMy(teacherId: number): Promise<TeacherSubjectClass[]> {
    return this.assignmentModel.findAll({
      where: { teacher_id: teacherId },
      include: ASSIGNMENT_INCLUDE,
      order: [['id', 'ASC']],
    });
  }

  /** Создание назначения: проверяем все три ссылки */
  async create(dto: CreateAssignmentDto): Promise<TeacherSubjectClass> {
    const teacher = await this.teacherModel.findByPk(dto.teacher_id);
    if (!teacher) {
      throw new NotFoundException(`Учитель с id=${dto.teacher_id} не найден`);
    }
    const subject = await this.subjectModel.findByPk(dto.subject_id);
    if (!subject) {
      throw new NotFoundException(`Предмет с id=${dto.subject_id} не найден`);
    }
    const schoolClass = await this.classModel.findByPk(dto.class_id);
    if (!schoolClass) {
      throw new NotFoundException(`Класс с id=${dto.class_id} не найден`);
    }

    // Дубликат тройки (teacher_id, subject_id, class_id) перехватит фильтр Sequelize → 409
    const created = await this.assignmentModel.create({
      teacher_id: dto.teacher_id,
      subject_id: dto.subject_id,
      class_id: dto.class_id,
    });
    return this.findOne(created.id);
  }

  /**
   * Удаление назначения.
   * В базе стоит ON DELETE CASCADE: вместе с назначением удалились бы все оценки
   * и пропуски. Поэтому заранее запрещаем удаление, если журнал уже заполнен.
   */
  async remove(id: number): Promise<{ message: string }> {
    const assignment = await this.assignmentModel.findByPk(id);
    if (!assignment) {
      throw new NotFoundException(`Назначение с id=${id} не найдено`);
    }

    const gradesCount = await this.gradeModel.count({ where: { assignment_id: id } });
    const absencesCount = await this.absenceModel.count({ where: { assignment_id: id } });
    if (gradesCount > 0 || absencesCount > 0) {
      throw new ConflictException(
        `Нельзя удалить назначение: по нему есть оценки (${gradesCount}) и пропуски (${absencesCount}). Сначала очистите журнал`,
      );
    }

    await assignment.destroy();
    return { message: `Назначение с id=${id} удалено` };
  }
}