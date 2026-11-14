import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ParentStudent } from './parent-student.model.js';

@Module({
  imports: [SequelizeModule.forFeature([ParentStudent])],
})
export class ParentStudentModule {}