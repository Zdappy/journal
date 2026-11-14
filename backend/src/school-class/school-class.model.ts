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
import { Student } from '../student/student.model.js';
import { TeacherSubjectClass } from '../teacher-subject-class/teacher-subject-class.model.js';

@Table({
  tableName: 'school_class',
  timestamps: false,
  indexes: [{ unique: true, fields: ['name', 'academic_year'] }],
})
export class SchoolClass extends Model {
  @Column({ type: DataType.INTEGER, autoIncrement: true, primaryKey: true })
  declare id: number;

  /** Название класса, например «5А» */
  @Column({ type: DataType.STRING(10), allowNull: false })
  declare name: string;

  /** Учебный год, например 2026 */
  @Column({ type: DataType.SMALLINT, allowNull: false })
  declare academic_year: number;

  /** Классный руководитель */
  @ForeignKey(() => Teacher)
  @Column({ type: DataType.INTEGER })
  declare homeroom_teacher_id: number | null;

  @BelongsTo(() => Teacher, {
    foreignKey: 'homeroom_teacher_id',
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  })
  declare homeroomTeacher: Teacher | null;

  @Column({ type: DataType.DATEONLY })
  declare started_at: string | null;

  /** Ученики этого класса */
  @HasMany(() => Student, {
    foreignKey: 'class_id',
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  declare students: Student[];

  /** Назначения учителей по предметам в этом классе */
  @HasMany(() => TeacherSubjectClass, {
    foreignKey: 'class_id',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  declare assignments: TeacherSubjectClass[];
}