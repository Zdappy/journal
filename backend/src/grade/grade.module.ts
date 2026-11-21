import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Grade } from './grade.model.js';
import { Student } from '../student/student.model.js';
import { User } from '../user/user.model.js';
import { Teacher } from '../teacher/teacher.model.js';
import { Subject } from '../subject/subject.model.js';
import { SchoolClass } from '../school-class/school-class.model.js';
import { TeacherSubjectClass } from '../teacher-subject-class/teacher-subject-class.model.js';
import { JournalAccessModule } from '../journal-access/journal-access.module.js';
import { GradeController } from './grade.controller.js';
import { GradeService } from './grade.service.js';

@Module({
  imports: [
    SequelizeModule.forFeature([
      Grade,
      Student,
      User,
      Teacher,
      Subject,
      SchoolClass,
      TeacherSubjectClass,
    ]),
    JournalAccessModule,
  ],
  controllers: [GradeController],
  providers: [GradeService],
  exports: [GradeService], // понадобится модулю отчётов
})
export class GradeModule {}