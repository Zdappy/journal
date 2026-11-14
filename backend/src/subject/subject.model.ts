import { Column, DataType, HasMany, Model, Table } from 'sequelize-typescript';
import { TeacherSubjectClass } from '../teacher-subject-class/teacher-subject-class.model.js';

@Table({ tableName: 'subject', timestamps: false })
export class Subject extends Model {
  @Column({ type: DataType.INTEGER, autoIncrement: true, primaryKey: true })
  declare id: number;

  @Column({ type: DataType.STRING(60), allowNull: false, unique: true })
  declare name: string;

  @Column({ type: DataType.TEXT })
  declare description: string | null;

  /** Назначения, где этот предмет преподаётся */
  @HasMany(() => TeacherSubjectClass, {
    foreignKey: 'subject_id',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  declare assignments: TeacherSubjectClass[];
}