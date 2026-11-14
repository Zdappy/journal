import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  HasMany,
  Model,
  Table,
} from 'sequelize-typescript';
import { User } from '../user/user.model.js';
import { SchoolClass } from '../school-class/school-class.model.js';
import { ParentStudent } from '../parent-student/parent-student.model.js';
import { Grade } from '../grade/grade.model.js';
import { Absence } from '../absence/absence.model.js';

@Table({ tableName: 'student', timestamps: false })
export class Student extends Model {
  @Column({ type: DataType.INTEGER, autoIncrement: true, primaryKey: true })
  declare id: number;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false, unique: true })
  declare user_id: number;

  @BelongsTo(() => User, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  declare user: User | null;

  /** Класс, в котором учится ученик */
  @ForeignKey(() => SchoolClass)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare class_id: number;

  @BelongsTo(() => SchoolClass, { onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
  declare schoolClass: SchoolClass | null;

  @Column({ type: DataType.DATEONLY })
  declare birth_date: string | null;

  @Column({ type: DataType.DATEONLY })
  declare enrolled_at: string | null;

  /** Связи с родителями */
  @HasMany(() => ParentStudent, {
    foreignKey: 'student_id',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  declare parents: ParentStudent[];

  /** Оценки ученика */
  @HasMany(() => Grade, {
    foreignKey: 'student_id',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  declare grades: Grade[];

  /** Пропуски ученика */
  @HasMany(() => Absence, {
    foreignKey: 'student_id',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  declare absences: Absence[];
}