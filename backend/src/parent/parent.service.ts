import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { Parent } from './parent.model.js';
import { User } from '../user/user.model.js';
import { ParentStudent } from '../parent-student/parent-student.model.js';
import { Student } from '../student/student.model.js';
import { SchoolClass } from '../school-class/school-class.model.js';
import { ParentQueryDto } from './dto/parent-query.dto.js';

export interface ParentPage {
  items: Parent[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

@Injectable()
export class ParentService {
  constructor(
    @InjectModel(Parent) private readonly parentModel: typeof Parent,
    @InjectModel(User) private readonly userModel: typeof User,
  ) {}

  /** Список родителей — нужен учителю, чтобы привязать родителя к ученику */
  async findAll(query: ParentQueryDto): Promise<ParentPage> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const search = query.search?.trim();

    let userIds: number[] | undefined;
    if (search) {
      const users = await this.userModel.findAll({
        where: {
          [Op.or]: [
            { lastname: { [Op.iLike]: `%${search}%` } },
            { firstname: { [Op.iLike]: `%${search}%` } },
          ],
        },
        attributes: ['id'],
      });
      userIds = users.map((u) => u.id);
    }

    const { rows, count } = await this.parentModel.findAndCountAll({
      where: userIds ? { user_id: { [Op.in]: userIds } } : {},
      include: [
        { model: User, as: 'user', attributes: ['id', 'lastname', 'firstname', 'middlename'], required: true },
      ],
      order: [['id', 'ASC']],
      limit,
      offset: (page - 1) * limit,
      distinct: true,
      subQuery: false,
    });

    return { items: rows, total: count, page, limit, pages: Math.ceil(count / limit) };
  }

  /** Родитель по id вместе со списком детей */
  async findOne(id: number): Promise<Parent> {
    const parent = await this.parentModel.findByPk(id, {
      include: [
        { model: User, as: 'user', attributes: ['id', 'lastname', 'firstname', 'middlename'] },
        {
          model: ParentStudent,
          as: 'children',
          attributes: ['id', 'student_id'],
          required: false,
          include: [
            {
              model: Student,
              as: 'student',
              attributes: ['id'],
              include: [
                { model: User, as: 'user', attributes: ['lastname', 'firstname', 'middlename'] },
                { model: SchoolClass, as: 'schoolClass', attributes: ['id', 'name', 'academic_year'] },
              ],
            },
          ],
        },
      ],
    });
    if (!parent) {
      throw new NotFoundException(`Родитель с id=${id} не найден`);
    }
    return parent;
  }
}