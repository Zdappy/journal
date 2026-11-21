import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { TeacherSubjectClass } from './teacher-subject-class.model.js';
import { Teacher } from '../teacher/teacher.model.js';
import { User } from '../user/user.model.js';
import { Subject } from '../subject/subject.model.js';
import { SchoolClass } from '../school-class/school-class.model.js';
import { Grade } from '../grade/grade.model.js';
import { Absence } from '../absence/absence.model.js';
import { JournalAccessModule } from '../journal-access/journal-access.module.js';
import { TeacherSubjectClassController } from './teacher-subject-class.controller.js';
import { TeacherSubjectClassService } from './teacher-subject-class.service.js';

@Module({
  imports: [
    SequelizeModule.forFeature([
      TeacherSubjectClass,
      Teacher,
      User,
      Subject,
      SchoolClass,
      Grade,
      Absence,
    ]),
    JournalAccessModule,
  ],
  controllers: [TeacherSubjectClassController],
  providers: [TeacherSubjectClassService],
  exports: [TeacherSubjectClassService],
})
export class TeacherSubjectClassModule {}