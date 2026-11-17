import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, type Includeable, type Order } from 'sequelize';
import { SchoolClass } from './school-class.model.js';
import { Teacher } from '../teacher/teacher.model.js';
import { User } from '../user/user.model.js';
import { Student } from '../student/student.model.js';
import { TeacherSubjectClass } from '../teacher-subject-class/teacher-subject-class.model.js';
import { CreateSchoolClassDto } from './dto/create-school-class.dto.js';
import { UpdateSchoolClassDto } from './dto/update-school-class.dto.js';
import { SchoolClassQueryDto } from './dto/school-class-query.dto.js';

/** Ответ со списком классов и данными для постраничного вывода */
export interface SchoolClassPage {
  items: SchoolClass[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

/**
 * Классный руководитель: класс → учитель → учётная запись (ФИО).
 * required: false — LEFT JOIN: класс вернётся, даже если руководитель не назначен.
 * as — имя свойства связи из модели (homeroomTeacher, user).
 */
const HOMEROOM_INCLUDE: Includeable = {
  model: Teacher,
  as: 'homeroomTeacher',
  attributes: ['id'],
  required: false,
  include: [
    {
      model: User,
      as: 'user',
      attributes: ['lastname', 'firstname', 'middlename'],
    },
  ],
};

@Injectable()
export class SchoolClassService {
  constructor(
    @InjectModel(SchoolClass)
    private readonly classModel: typeof SchoolClass,
    @InjectModel(Teacher)
    private readonly teacherModel: typeof Teacher,
    @InjectModel(Student)
    private readonly studentModel: typeof Student,
    @InjectModel(TeacherSubjectClass)
    private readonly assignmentModel: typeof TeacherSubjectClass,
  ) {}

  /** Список классов: поиск, фильтр по году, сортировка, постраничный вывод */
  async findAll(query: SchoolClassQueryDto): Promise<SchoolClassPage> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const search = query.search?.trim();

    const { rows, count } = await this.classModel.findAndCountAll({
      where: {
        // PostgreSQL: iLike — поиск без учёта регистра
        ...(search ? { name: { [Op.iLike]: `%${search}%` } } : {}),
        ...(query.academic_year ? { academic_year: query.academic_year } : {}),
      },
      include: [HOMEROOM_INCLUDE],
      order: this.buildOrder(query.sort),
      limit,
      offset: (page - 1) * limit,
      distinct: true, // считать классы, а не строки соединения таблиц
    });

    return { items: rows, total: count, page, limit, pages: Math.ceil(count / limit) };
  }

  /** Класс по id: с классным руководителем и списком учеников */
  async findOne(id: number): Promise<SchoolClass> {
    const schoolClass = await this.classModel.findByPk(id, {
      include: [
        HOMEROOM_INCLUDE,
        {
          model: Student,
          as: 'students',
          attributes: ['id', 'birth_date'],
          required: false,
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['lastname', 'firstname', 'middlename'],
            },
          ],
        },
      ],
    });

    if (!schoolClass) {
      throw new NotFoundException(`Класс с id=${id} не найден`);
    }
    return schoolClass;
  }

  /** Добавление класса */
  async create(dto: CreateSchoolClassDto): Promise<SchoolClass> {
    await this.ensureTeacherExists(dto.homeroom_teacher_id);
    // Дубликат пары (name, academic_year) перехватит фильтр Sequelize → 409
    const created = await this.classModel.create({ ...dto });
    return this.findOne(created.id);
  }

  /** Изменение класса */
  async update(id: number, dto: UpdateSchoolClassDto): Promise<SchoolClass> {
    const schoolClass = await this.classModel.findByPk(id);
    if (!schoolClass) {
      throw new NotFoundException(`Класс с id=${id} не найден`);
    }
    if (dto.homeroom_teacher_id !== undefined) {
      await this.ensureTeacherExists(dto.homeroom_teacher_id);
    }
    await schoolClass.update({ ...dto });
    return this.findOne(id);
  }

  /**
   * Удаление класса.
   * В базе на student.class_id стоит RESTRICT, а назначения удаляются каскадом
   * вместе с оценками и пропусками. Поэтому проверяем всё заранее и не даём
   * случайно уничтожить журнал.
   */
  async remove(id: number): Promise<{ message: string }> {
    const schoolClass = await this.classModel.findByPk(id);
    if (!schoolClass) {
      throw new NotFoundException(`Класс с id=${id} не найден`);
    }

    const studentsCount = await this.studentModel.count({ where: { class_id: id } });
    if (studentsCount > 0) {
      throw new ConflictException(
        `Нельзя удалить класс: в нём числится ${studentsCount} ученик(ов). Сначала переведите их в другой класс`,
      );
    }

    const assignmentsCount = await this.assignmentModel.count({ where: { class_id: id } });
    if (assignmentsCount > 0) {
      throw new ConflictException(
        `Нельзя удалить класс: по нему есть ${assignmentsCount} назначений учителей и записи в журнале`,
      );
    }

    await schoolClass.destroy();
    return { message: `Класс с id=${id} удалён` };
  }

  /** Проверка существования классного руководителя */
  private async ensureTeacherExists(teacherId: number | null | undefined): Promise<void> {
    if (teacherId === null || teacherId === undefined) {
      return; // руководителя можно не назначать
    }
    const teacher = await this.teacherModel.findByPk(teacherId);
    if (!teacher) {
      throw new NotFoundException(`Учитель с id=${teacherId} не найден`);
    }
  }

  /** Порядок сортировки: по умолчанию новые учебные годы сначала */
  private buildOrder(sort?: string): Order {
    switch (sort) {
      case 'name_asc':
        return [['name', 'ASC']];
      case 'name_desc':
        return [['name', 'DESC']];
      case 'year_asc':
        return [
          ['academic_year', 'ASC'],
          ['name', 'ASC'],
        ];
      case 'year_desc':
        return [
          ['academic_year', 'DESC'],
          ['name', 'ASC'],
        ];
      default:
        return [
          ['academic_year', 'DESC'],
          ['name', 'ASC'],
        ];
    }
  }
}