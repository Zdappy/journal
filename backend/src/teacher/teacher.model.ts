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
import { TeacherSubjectClass } from '../teacher-subject-class/teacher-subject-class.model.js';
import { Grade } from '../grade/grade.model.js';
import { Absence } from '../absence/absence.model.js';

@Table({ tableName: 'teacher', timestamps: false })
export class Teacher extends Model {
  @Column({ type: DataType.INTEGER, autoIncrement: true, primaryKey: true })
  declare id: number;

  /** Связь 1:1 с учётной записью */
  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false, unique: true })
  declare user_id: number;

  @BelongsTo(() => User, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  declare user: User | null;

  @Column({ type: DataType.STRING(20) })
  declare phone: string | null;

  @Column({ type: DataType.STRING(100) })
  declare email: string | null;

  /** Классы, где учитель — классный руководитель */
  @HasMany(() => SchoolClass, {
    foreignKey: 'homeroom_teacher_id',
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  })
  declare homeroomClasses: SchoolClass[];

  /** Назначения «учитель-предмет-класс» */
  @HasMany(() => TeacherSubjectClass, {
    foreignKey: 'teacher_id',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  declare assignments: TeacherSubjectClass[];

  /** Оценки, поставленные этим учителем */
  @HasMany(() => Grade, {
    foreignKey: 'created_by',
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  })
  declare createdGrades: Grade[];

  /** Пропуски, отмеченные этим учителем */
  @HasMany(() => Absence, {
    foreignKey: 'created_by',
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  })
  declare createdAbsences: Absence[];
}