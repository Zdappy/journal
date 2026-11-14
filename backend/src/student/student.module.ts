import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Student } from './student.model.js';

@Module({
  imports: [SequelizeModule.forFeature([Student])],
})
export class StudentModule {}