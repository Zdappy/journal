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
import { ParentStudent } from '../parent-student/parent-student.model.js';

@Table({ tableName: 'parent', timestamps: false })
export class Parent extends Model {
  @Column({ type: DataType.INTEGER, autoIncrement: true, primaryKey: true })
  declare id: number;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false, unique: true })
  declare user_id: number;

  @BelongsTo(() => User, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  declare user: User | null;

  @Column({ type: DataType.STRING(20) })
  declare phone: string | null;

  @Column({ type: DataType.STRING(100) })
  declare email: string | null;

  /** Связи с детьми (у родителя может быть несколько детей) */
  @HasMany(() => ParentStudent, {
    foreignKey: 'parent_id',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  declare children: ParentStudent[];
}