import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { Parent } from '../parent/parent.model.js';
import { Student } from '../student/student.model.js';

/**
 * Промежуточная таблица «Родитель ↔ Ребёнок» (∞:∞).
 * Отдельный id добавлен для удобного CRUD через API,
 * плюс уникальный индекс на пару (parent_id, student_id).
 */
@Table({
  tableName: 'parent_student',
  timestamps: false,
  indexes: [{ unique: true, fields: ['parent_id', 'student_id'] }],
})
export class ParentStudent extends Model {
  @Column({ type: DataType.INTEGER, autoIncrement: true, primaryKey: true })
  declare id: number;

  @ForeignKey(() => Parent)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare parent_id: number;

  @BelongsTo(() => Parent, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  declare parent: Parent | null;

  @ForeignKey(() => Student)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare student_id: number;

  @BelongsTo(() => Student, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  declare student: Student | null;
}