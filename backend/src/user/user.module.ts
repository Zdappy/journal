import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { User } from './user.model.js';
import { Teacher } from '../teacher/teacher.model.js';
import { Student } from '../student/student.model.js';
import { Parent } from '../parent/parent.model.js';
import { SchoolClass } from '../school-class/school-class.model.js';
import { UserService } from './user.service.js';

@Module({
  imports: [SequelizeModule.forFeature([User, Teacher, Student, Parent, SchoolClass])],
  providers: [UserService],
  exports: [UserService], // сервис нужен модулю аутентификации
})
export class UserModule {}