import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Teacher } from './teacher.model.js';

@Injectable()
export class TeacherService {
  constructor(
    @InjectModel(Teacher)
    private readonly teacherModel: typeof Teacher,
  ) {}

  /** Учитель по id профиля. Если не найден — 404 */
  async findById(id: number): Promise<Teacher> {
    const teacher = await this.teacherModel.findByPk(id);
    if (!teacher) {
      throw new NotFoundException(`Учитель с id=${id} не найден`);
    }
    return teacher;
  }

  /**
   * Профиль учителя по id учётной записи (из токена).
   * нужен потому, что в токене лежит user.id, а в журнале — teacher.id
   */
  async findByUserId(userId: number): Promise<Teacher> {
    const teacher = await this.teacherModel.findOne({ where: { user_id: userId } });
    if (!teacher) {
      throw new NotFoundException('Профиль учителя для текущего пользователя не найден');
    }
    return teacher;
  }
}