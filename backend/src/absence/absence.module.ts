import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Absence } from './absence.model.js';
import { Student } from '../student/student.model.js';
import { User } from '../user/user.model.js';
import { Teacher } from '../teacher/teacher.model.js';
import { Subject } from '../subject/subject.model.js';
import { SchoolClass } from '../school-class/school-class.model.js';
import { TeacherSubjectClass } from '../teacher-subject-class/teacher-subject-class.model.js';
import { JournalAccessModule } from '../journal-access/journal-access.module.js';
import { AbsenceController } from './absence.controller.js';
import { AbsenceService } from './absence.service.js';

@Module({
  imports: [
    SequelizeModule.forFeature([
      Absence,
      Student,
      User,
      Teacher,
      Subject,
      SchoolClass,
      TeacherSubjectClass,
    ]),
    JournalAccessModule,
  ],
  controllers: [AbsenceController],
  providers: [AbsenceService],
  exports: [AbsenceService],
})
export class AbsenceModule {}