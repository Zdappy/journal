import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Parent } from './parent.model.js';
import { User } from '../user/user.model.js';
import { ParentStudent } from '../parent-student/parent-student.model.js';
import { Student } from '../student/student.model.js';
import { SchoolClass } from '../school-class/school-class.model.js';
import { ParentController } from './parent.controller.js';
import { ParentService } from './parent.service.js';

@Module({
  imports: [SequelizeModule.forFeature([Parent, User, ParentStudent, Student, SchoolClass])],
  controllers: [ParentController],
  providers: [ParentService],
})
export class ParentModule {}