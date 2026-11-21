import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, type Includeable, type Order } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { Student } from './student.model.js';
import { User } from '../user/user.model.js';
import { SchoolClass } from '../school-class/school-class.model.js';
import { Grade } from '../grade/grade.model.js';
import { Absence } from '../absence/absence.model.js';
import { JournalAccessService } from '../journal-access/journal-access.service.js';
import { StudentQueryDto } from './dto/student-query.dto.js';
import { UpdateStudentDto } from './dto/update-student.dto.js';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface.js';

export interface StudentPage {
  items: Student[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

const STUDENT_INCLUDE: Includeable[] = [
  { model: User, as: 'user', attributes: ['id', 'lastname', 'firstname', 'middlename'], required: true },
  { model: SchoolClass, as: 'schoolClass', attributes: ['id', 'name', 'academic_year'], required: false },
];

@Injectable()
export class StudentService {
  constructor(
    @InjectModel(Student) private readonly studentModel: typeof Student,
    @InjectModel(User) private readonly userModel: typeof User,
    @InjectModel(SchoolClass) private readonly classModel: typeof SchoolClass,
    @InjectModel(Grade) private readonly gradeModel: typeof Grade,
    @InjectModel(Absence) private readonly absenceModel: typeof Absence,
    private readonly access: JournalAccessService,
    private readonly sequelize: Sequelize,
  ) {}

  /** Список учеников: поиск по ФИО, фильтр по классу, сортировка, пагинация */
  async findAll(query: StudentQueryDto): Promise<StudentPage> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const search = query.search?.trim();

    // ФИО хранится в таблице user, поэтому сначала находим подходящие учётные записи,
    // а затем фильтруем учеников по их id. Так не нужна фильтрация по вложенной таблице.
    let userIds: number[] | undefined;
    if (search) {
      const users = await this.userModel.findAll({
        where: {
          [Op.or]: [
            { lastname: { [Op.iLike]: `%${search}%` } },
            { firstname: { [Op.iLike]: `%${search}%` } },
            { middlename: { [Op.iLike]: `%${search}%` } },
          ],
        },
        attributes: ['id'],
      });
      userIds = users.map((u) => u.id);
    }

    const { rows, count } = await this.studentModel.findAndCountAll({
      where: {
        ...(query.class_id ? { class_id: query.class_id } : {}),
        ...(userIds ? { user_id: { [Op.in]: userIds } } : {}),
      },
      include: STUDENT_INCLUDE,
      order: this.buildOrder(query.sort),
      limit,
      offset: (page - 1) * limit,
      distinct: true,
      subQuery: false, // сортировка по полю связанной таблицы user
    });

    return { items: rows, total: count, page, limit, pages: Math.ceil(count / limit) };
  }

  /** Ученик по id. Ученик видит только себя, родитель — только своих детей */
  async findOne(user: JwtPayload, id: number): Promise<Student> {
    await this.access.assertCanViewStudent(user, id);
    const student = await this.studentModel.findByPk(id, { include: STUDENT_INCLUDE });
    if (!student) {
      throw new NotFoundException(`Ученик с id=${id} не найден`);
    }
    return student;
  }

  /** Изменение данных ученика: перевод в другой класс и правка ФИО */
  async update(id: number, dto: UpdateStudentDto): Promise<Student> {
    const student = await this.studentModel.findByPk(id);
    if (!student) {
      throw new NotFoundException(`Ученик с id=${id} не найден`);
    }

    if (dto.class_id !== undefined) {
      const schoolClass = await this.classModel.findByPk(dto.class_id);
      if (!schoolClass) {
        throw new NotFoundException(`Класс с id=${dto.class_id} не найден`);
      }
    }

    // Две таблицы изменяем в одной транзакции
    await this.sequelize.transaction(async (t) => {
      await student.update(
        {
          class_id: dto.class_id ?? student.class_id,
          birth_date: dto.birth_date ?? student.birth_date,
          enrolled_at: dto.enrolled_at ?? student.enrolled_at,
        },
        { transaction: t },
      );

      if (dto.lastname !== undefined || dto.firstname !== undefined || dto.middlename !== undefined) {
        await this.userModel.update(
          {
            ...(dto.lastname !== undefined ? { lastname: dto.lastname } : {}),
            ...(dto.firstname !== undefined ? { firstname: dto.firstname } : {}),
            ...(dto.middlename !== undefined ? { middlename: dto.middlename } : {}),
          },
          { where: { id: student.user_id }, transaction: t },
        );
      }
    });

    const updated = await this.studentModel.findByPk(id, { include: STUDENT_INCLUDE });
    return updated!;
  }

  /**
   * Удаление ученика вместе с его учётной записью.
   * Если по ученику есть оценки или пропуски — удалять нельзя: журнал perdería данные.
   */
  async remove(id: number): Promise<{ message: string }> {
    const student = await this.studentModel.findByPk(id);
    if (!student) {
      throw new NotFoundException(`Ученик с id=${id} не найден`);
    }

    const grades = await this.gradeModel.count({ where: { student_id: id } });
    const absences = await this.absenceModel.count({ where: { student_id: id } });
    if (grades > 0 || absences > 0) {
      throw new ConflictException(
        `Нельзя удалить ученика: по нему есть оценки (${grades}) и пропуски (${absences}). Сначала очистите журнал`,
      );
    }

    // ON DELETE CASCADE: удаление учётной записи удалит профиль ученика и связи с родителями
    await this.userModel.destroy({ where: { id: student.user_id } });
    return { message: `Ученик с id=${id} и его учётная запись удалены` };
  }

  private buildOrder(sort?: string): Order {
    switch (sort) {
      case 'id_asc':
        return [['id', 'ASC']];
      case 'id_desc':
        return [['id', 'DESC']];
      case 'name_desc':
        return [[{ model: User, as: 'user' }, 'lastname', 'DESC']];
      default:
        return [
          [{ model: User, as: 'user' }, 'lastname', 'ASC'],
          [{ model: User, as: 'user' }, 'firstname', 'ASC'],
        ];
    }
  }
}