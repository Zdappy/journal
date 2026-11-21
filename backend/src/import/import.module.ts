import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Student } from '../student/student.model.js';
import { User } from '../user/user.model.js';
import { SchoolClass } from '../school-class/school-class.model.js';
import { Subject } from '../subject/subject.model.js';
import { TeacherSubjectClass } from '../teacher-subject-class/teacher-subject-class.model.js';
import { Grade } from '../grade/grade.model.js';
import { JournalAccessModule } from '../journal-access/journal-access.module.js';
import { ImportController } from './import.controller.js';
import { ImportService } from './import.service.js';

@Module({
  imports: [
    SequelizeModule.forFeature([Student, User, SchoolClass, Subject, TeacherSubjectClass, Grade]),
    JournalAccessModule,
  ],
  controllers: [ImportController],
  providers: [ImportService],
})
export class ImportModule {}