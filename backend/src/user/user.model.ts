import { Column, DataType, DefaultScope, HasOne, Model, Table } from 'sequelize-typescript';
import { Role } from '../common/enums/role.enum.js';
import { Teacher } from '../teacher/teacher.model.js';
import { Student } from '../student/student.model.js';
import { Parent } from '../parent/parent.model.js';

// Поле password не выбирается из БД в обычных запросах,
// чтобы хеш пароля случайно не попал в ответ клиенту
@DefaultScope(() => ({
  attributes: { exclude: ['password'] },
}))
@Table({ tableName: 'user', timestamps: false })
export class User extends Model {
  @Column({ type: DataType.INTEGER, autoIncrement: true, primaryKey: true })
  declare id: number;

  @Column({ type: DataType.STRING(50), allowNull: false, unique: true })
  declare username: string;

  /** Хеш пароля (никогда не храним пароль в открытом виде) */
  @Column({ type: DataType.STRING(150), allowNull: false })
  declare password: string;

  @Column({ type: DataType.ENUM(...Object.values(Role)), allowNull: false })
  declare role: Role;

  @Column({ type: DataType.STRING(30), allowNull: false })
  declare lastname: string;

  @Column({ type: DataType.STRING(30), allowNull: false })
  declare firstname: string;

  @Column({ type: DataType.STRING(30) })
  declare middlename: string | null;

  @Column({ type: DataType.STRING(255) })
  declare url_avatar: string | null;

  @Column({ type: DataType.DATE, allowNull: false, defaultValue: DataType.NOW })
  declare created_at: Date;

  // ------- Профиль роли (заполнен только один из трёх) -------

  @HasOne(() => Teacher, { foreignKey: 'user_id', onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  declare teacher: Teacher | null;

  @HasOne(() => Student, { foreignKey: 'user_id', onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  declare student: Student | null;

  @HasOne(() => Parent, { foreignKey: 'user_id', onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  declare parent: Parent | null;
}