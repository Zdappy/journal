import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ParentStudent } from './parent-student.model.js';
import { Parent } from '../parent/parent.model.js';
import { Student } from '../student/student.model.js';
import { User } from '../user/user.model.js';
import { SchoolClass } from '../school-class/school-class.model.js';
import { JournalAccessModule } from '../journal-access/journal-access.module.js';
import { ParentStudentController } from './parent-student.controller.js';
import { ParentStudentService } from './parent-student.service.js';

@Module({
  imports: [
    SequelizeModule.forFeature([ParentStudent, Parent, Student, User, SchoolClass]),
    JournalAccessModule,
  ],
  controllers: [ParentStudentController],
  providers: [ParentStudentService],
})
export class ParentStudentModule {}