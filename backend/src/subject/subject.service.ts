import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, type Order } from 'sequelize';
import { Subject } from './subject.model.js';
import { CreateSubjectDto } from './dto/create-subject.dto.js';
import { UpdateSubjectDto } from './dto/update-subject.dto.js';
import { SubjectQueryDto } from './dto/subject-query.dto.js';

/** Ответ со списком предметов и данными для постраничного вывода */
export interface SubjectPage {
  items: Subject[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

@Injectable()
export class SubjectService {
  constructor(
    @InjectModel(Subject)
    private readonly subjectModel: typeof Subject,
  ) {}

  /** Список предметов: поиск, сортировка, постраничный вывод */
  async findAll(query: SubjectQueryDto): Promise<SubjectPage> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const search = query.search?.trim();

    // PostgreSQL: LIKE учитывает регистр, поэтому iLike —
    // запрос ?search=мат найдёт «Математика»
    const where = search ? { name: { [Op.iLike]: `%${search}%` } } : undefined;

    const order: Order = query.sort
      ? [['name', query.sort === 'name_asc' ? 'ASC' : 'DESC']]
      : [['id', 'ASC']];

    // findAndCountAll возвращает записи текущей страницы и общее количество
    const { rows, count } = await this.subjectModel.findAndCountAll({
      where,
      order,
      limit,
      offset: (page - 1) * limit,
    });

    return {
      items: rows,
      total: count,
      page,
      limit,
      pages: Math.ceil(count / limit),
    };
  }

  /** Предмет по id. Если не найден — 404 */
  async findOne(id: number): Promise<Subject> {
    const subject = await this.subjectModel.findByPk(id);
    if (!subject) {
      throw new NotFoundException(`Предмет с id=${id} не найден`);
    }
    return subject;
  }

  /** Добавление предмета. Дубликат названия перехватит фильтр Sequelize (409) */
  create(dto: CreateSubjectDto): Promise<Subject> {
    return this.subjectModel.create({ ...dto });
  }

  /** Изменение предмета */
  async update(id: number, dto: UpdateSubjectDto): Promise<Subject> {
    const subject = await this.findOne(id); // если не найден — будет 404
    return subject.update({ ...dto });
  }

  /** Удаление предмета */
  async remove(id: number): Promise<{ message: string }> {
    const subject = await this.findOne(id);
    await subject.destroy();
    return { message: `Предмет с id=${id} удалён` };
  }
}