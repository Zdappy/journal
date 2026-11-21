import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { type Includeable } from 'sequelize';
import { ParentStudent } from './parent-student.model.js';
import { Parent } from '../parent/parent.model.js';
import { Student } from '../student/student.model.js';
import { User } from '../user/user.model.js';
import { SchoolClass } from '../school-class/school-class.model.js';
import { JournalAccessService } from '../journal-access/journal-access.service.js';
import { CreateLinkDto } from './dto/create-link.dto.js';
import { LinkQueryDto } from './dto/link-query.dto.js';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface.js';

const LINK_INCLUDE: Includeable[] = [
  {
    model: Parent,
    as: 'parent',
    attributes: ['id'],
    required: false,
    include: [{ model: User, as: 'user', attributes: ['lastname', 'firstname', 'middlename'] }],
  },
  {
    model: Student,
    as: 'student',
    attributes: ['id'],
    required: false,
    include: [
      { model: User, as: 'user', attributes: ['lastname', 'firstname', 'middlename'] },
      { model: SchoolClass, as: 'schoolClass', attributes: ['id', 'name', 'academic_year'] },
    ],
  },
];

@Injectable()
export class ParentStudentService {
  constructor(
    @InjectModel(ParentStudent) private readonly linkModel: typeof ParentStudent,
    @InjectModel(Parent) private readonly parentModel: typeof Parent,
    private readonly access: JournalAccessService,
  ) {}

  findAll(query: LinkQueryDto): Promise<ParentStudent[]> {
    return this.linkModel.findAll({
      where: {
        ...(query.parent_id ? { parent_id: query.parent_id } : {}),
        ...(query.student_id ? { student_id: query.student_id } : {}),
      },
      include: LINK_INCLUDE,
      order: [['id', 'ASC']],
    });
  }

  /** Дети текущего родителя */
  async myChildren(user: JwtPayload): Promise<ParentStudent[]> {
    const parentId = await this.access.parentIdOf(user);
    return this.linkModel.findAll({
      where: { parent_id: parentId },
      include: LINK_INCLUDE,
      order: [['id', 'ASC']],
    });
  }

  /** Привязка родителя к ученику. Дубликат перехватит фильтр Sequelize → 409 */
  async create(dto: CreateLinkDto): Promise<ParentStudent> {
    const parent = await this.parentModel.findByPk(dto.parent_id);
    if (!parent) {
      throw new NotFoundException(`Родитель с id=${dto.parent_id} не найден`);
    }
    await this.access.studentById(dto.student_id);

    const created = await this.linkModel.create({
      parent_id: dto.parent_id,
      student_id: dto.student_id,
    });
    const link = await this.linkModel.findByPk(created.id, { include: LINK_INCLUDE });
    return link!;
  }

  async remove(id: number): Promise<{ message: string }> {
    const link = await this.linkModel.findByPk(id);
    if (!link) {
      throw new NotFoundException(`Связь с id=${id} не найдена`);
    }
    await link.destroy();
    return { message: `Связь с id=${id} удалена` };
  }
}