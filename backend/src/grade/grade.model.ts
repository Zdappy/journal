import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { Student } from '../student/student.model.js';
import { Teacher } from '../teacher/teacher.model.js';
import { TeacherSubjectClass } from '../teacher-subject-class/teacher-subject-class.model.js';
import { GradeType } from '../common/enums/grade-type.enum.js';

@Table({ tableName: 'grade', timestamps: false })
export class Grade extends Model {
  @Column({ type: DataType.INTEGER, autoIncrement: true, primaryKey: true })
  declare id: number;

  /** Кому поставлена оценка */
  @ForeignKey(() => Student)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare student_id: number;

  @BelongsTo(() => Student, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  declare student: Student | null;

  /** По какому предмету и в каком классе (через назначение) */
  @ForeignKey(() => TeacherSubjectClass)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare assignment_id: number;

  @BelongsTo(() => TeacherSubjectClass, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  declare assignment: TeacherSubjectClass | null;

  /** Значение оценки 1..5 */
  @Column({
    type: DataType.SMALLINT,
    allowNull: false,
    validate: { min: 1, max: 5 },
  })
  declare value: number;

  /** Дата занятия, за которое поставлена оценка */
  @Column({ type: DataType.DATEONLY, allowNull: false })
  declare lesson_date: string;

  /** За что поставлена оценка */
  @Column({
    type: DataType.ENUM(...Object.values(GradeType)),
    allowNull: false,
    defaultValue: GradeType.Lesson,
  })
  declare grade_type: GradeType;

  /** Вес оценки для расчёта взвешенного среднего балла */
  @Column({ type: DataType.SMALLINT, allowNull: false, defaultValue: 1 })
  declare weight: number;

  /** Комментарий учителя к оценке */
  @Column({ type: DataType.STRING(255) })
  declare comment: string | null;

  /** Кто поставил оценку */
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