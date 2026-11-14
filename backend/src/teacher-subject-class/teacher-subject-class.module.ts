import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { TeacherSubjectClass } from './teacher-subject-class.model.js';

@Module({
  imports: [SequelizeModule.forFeature([TeacherSubjectClass])],
})
export class TeacherSubjectClassModule {}