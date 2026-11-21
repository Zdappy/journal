import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Student } from './student.model.js';
import { User } from '../user/user.model.js';
import { SchoolClass } from '../school-class/school-class.model.js';
import { Grade } from '../grade/grade.model.js';
import { Absence } from '../absence/absence.model.js';
import { JournalAccessModule } from '../journal-access/journal-access.module.js';
import { StudentController } from './student.controller.js';
import { StudentService } from './student.service.js';

@Module({
  imports: [
    SequelizeModule.forFeature([Student, User, SchoolClass, Grade, Absence]),
    JournalAccessModule,
  ],
  controllers: [StudentController],
  providers: [StudentService],
  exports: [StudentService],
})
export class StudentModule {}