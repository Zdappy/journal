import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { SchoolClass } from './school-class.model.js';
import { Teacher } from '../teacher/teacher.model.js';
import { User } from '../user/user.model.js';
import { Student } from '../student/student.model.js';
import { TeacherSubjectClass } from '../teacher-subject-class/teacher-subject-class.model.js';
import { SchoolClassController } from './school-class.controller.js';
import { SchoolClassService } from './school-class.service.js';

@Module({
  // Teacher и User нужны для include, Student и TeacherSubjectClass — для проверок при удалении
  imports: [
    SequelizeModule.forFeature([SchoolClass, Teacher, User, Student, TeacherSubjectClass]),
  ],
  controllers: [SchoolClassController],
  providers: [SchoolClassService],
})
export class SchoolClassModule {}