import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { Student } from '../student/student.model.js';
import { Teacher } from '../teacher/teacher.model.js';
import { TeacherSubjectClass } from '../teacher-subject-class/teacher-subject-class.model.js';
import { AbsenceType } from '../common/enums/absence-type.enum.js';

@Table({
  tableName: 'absence',
  timestamps: false,
  indexes: [{ unique: true, fields: ['student_id', 'assignment_id', 'lesson_date'] }],
})
export class Absence extends Model {
  @Column({ type: DataType.INTEGER, autoIncrement: true, primaryKey: true })
  declare id: number;

  /** Кто отсутствовал */
  @ForeignKey(() => Student)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare student_id: number;

  @BelongsTo(() => Student, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  declare student: Student | null;

  /** На каком занятии (предмет + класс через назначение) */
  @ForeignKey(() => TeacherSubjectClass)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare assignment_id: number;

  @BelongsTo(() => TeacherSubjectClass, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  declare assignment: TeacherSubjectClass | null;

  /** Дата занятия */
  @Column({ type: DataType.DATEONLY, allowNull: false })
  declare lesson_date: string;

  /** Тип пропуска */
  @Column({
    type: DataType.ENUM(...Object.values(AbsenceType)),
    allowNull: false,
    defaultValue: AbsenceType.Invalid,
  })
  declare absence_type: AbsenceType;

  /** Причина пропуска (свободный текст) */
  @Column({ type: DataType.STRING(255) })
  declare reason: string | null;

  /** Кто отметил пропуск */
  @ForeignKey(() => Teacher)
  @Column({ type: DataType.INTEGER })
  declare created_by: number | null;

  @BelongsTo(() => Teacher, {
    foreignKey: 'created_by',
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  })
  declare createdByTeacher: Teacher | null;

  @Column({ type: DataType.DATE, allowNull: false, defaultValue: DataType.NOW })
  declare created_at: Date;
}