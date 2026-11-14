import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  HasMany,
  Model,
  Table,
} from 'sequelize-typescript';
import { Teacher } from '../teacher/teacher.model.js';
import { Subject } from '../subject/subject.model.js';
import { SchoolClass } from '../school-class/school-class.model.js';
import { Grade } from '../grade/grade.model.js';
import { Absence } from '../absence/absence.model.js';

/**
 * Ключевая таблица «Назначение»: учитель ведёт предмет X в классе Y.
 * Реализует требование: «учитель работает со своими классами и предметами».
 */
@Table({
  tableName: 'teacher_subject_class',
  timestamps: false,
  indexes: [{ unique: true, fields: ['teacher_id', 'subject_id', 'class_id'] }],
})
export class TeacherSubjectClass extends Model {
  @Column({ type: DataType.INTEGER, autoIncrement: true, primaryKey: true })
  declare id: number;

  @ForeignKey(() => Teacher)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare teacher_id: number;

  @BelongsTo(() => Teacher, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  declare teacher: Teacher | null;

  @ForeignKey(() => Subject)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare subject_id: number;

  @BelongsTo(() => Subject, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  declare subject: Subject | null;

  @ForeignKey(() => SchoolClass)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare class_id: number;

  @BelongsTo(() => SchoolClass, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  declare schoolClass: SchoolClass | null;

  /** Оценки, выставленные в рамках этого назначения */
  @HasMany(() => Grade, {
    foreignKey: 'assignment_id',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  declare grades: Grade[];

  /** Пропуски в рамках этого назначения */
  @HasMany(() => Absence, {
    foreignKey: 'assignment_id',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  declare absences: Absence[];
}