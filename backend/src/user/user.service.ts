import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { User } from './user.model.js';
import { Teacher } from '../teacher/teacher.model.js';
import { Student } from '../student/student.model.js';
import { Parent } from '../parent/parent.model.js';
import { SchoolClass } from '../school-class/school-class.model.js';
import { Role } from '../common/enums/role.enum.js';

/** Данные новой учётной записи. Пароль приходит уже захешированным */
export interface NewUserData {
  username: string;
  password: string;
  role: Role;
  lastname: string;
  firstname: string;
  middlename?: string | null;
  phone?: string | null;
  email?: string | null;
  /** Только для роли Ученик */
  class_id?: number | null;
}

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User) private readonly userModel: typeof User,
    @InjectModel(Teacher) private readonly teacherModel: typeof Teacher,
    @InjectModel(Student) private readonly studentModel: typeof Student,
    @InjectModel(Parent) private readonly parentModel: typeof Parent,
    @InjectModel(SchoolClass) private readonly classModel: typeof SchoolClass,
    private readonly sequelize: Sequelize,
  ) {}

  /** Пользователь по id вместе с профилем роли (без пароля — действует DefaultScope) */
  async findById(id: number): Promise<User> {
    const user = await this.userModel.findByPk(id, {
      include: [
        { model: Teacher, as: 'teacher', attributes: ['id'], required: false },
        { model: Student, as: 'student', attributes: ['id', 'class_id'], required: false },
        { model: Parent, as: 'parent', attributes: ['id'], required: false },
      ],
    });
    if (!user) {
      throw new NotFoundException(`Пользователь с id=${id} не найден`);
    }
    return user;
  }

  /** Поиск по логину ВМЕСТЕ с хешем пароля — нужно только при входе */
  findByUsernameWithPassword(username: string): Promise<User | null> {
    return this.userModel.unscoped().findOne({ where: { username } });
  }

  async exists(username: string): Promise<boolean> {
    const count = await this.userModel.count({ where: { username } });
    return count > 0;
  }

  /**
   * Создание пользователя и профиля его роли в одной транзакции.
   * Если профиль создать не удалось (например, нет такого класса),
   * учётная запись тоже не сохранится — «пользователей без роли» не будет.
   */
  async createWithProfile(data: NewUserData): Promise<User> {
    if (await this.exists(data.username)) {
      throw new ConflictException('Пользователь с таким логином уже существует');
    }

    const userId = await this.sequelize.transaction(async (t) => {
      const user = await this.userModel.create(
        {
          username: data.username,
          password: data.password,
          role: data.role,
          lastname: data.lastname,
          firstname: data.firstname,
          middlename: data.middlename ?? null,
        },
        { transaction: t },
      );

      if (data.role === Role.Teacher) {
        await this.teacherModel.create(
          { user_id: user.id, phone: data.phone ?? null, email: data.email ?? null },
          { transaction: t },
        );
      } else if (data.role === Role.Parent) {
        await this.parentModel.create(
          { user_id: user.id, phone: data.phone ?? null, email: data.email ?? null },
          { transaction: t },
        );
      } else {
        if (!data.class_id) {
          throw new BadRequestException('Для ученика необходимо указать класс (class_id)');
        }
        const schoolClass = await this.classModel.findByPk(data.class_id, { transaction: t });
        if (!schoolClass) {
          throw new NotFoundException(`Класс с id=${data.class_id} не найден`);
        }
        await this.studentModel.create(
          { user_id: user.id, class_id: data.class_id },
          { transaction: t },
        );
      }

      return user.id;
    });

    return this.findById(userId);
  }
}