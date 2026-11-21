import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Teacher } from '../teacher/teacher.model.js';
import { Student } from '../student/student.model.js';
import { Parent } from '../parent/parent.model.js';
import { ParentStudent } from '../parent-student/parent-student.model.js';
import { TeacherSubjectClass } from '../teacher-subject-class/teacher-subject-class.model.js';
import { User } from '../user/user.model.js';
import { SchoolClass } from '../school-class/school-class.model.js';
import { JournalAccessService } from './journal-access.service.js';

@Module({
  imports: [
    SequelizeModule.forFeature([
  Teacher, Student, Parent, ParentStudent, TeacherSubjectClass, User, SchoolClass,
]),
  ],
  providers: [JournalAccessService],
  exports: [JournalAccessService],
})
export class JournalAccessModule {}