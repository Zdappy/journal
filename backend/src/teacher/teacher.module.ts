import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Teacher } from './teacher.model.js';

@Module({
  imports: [SequelizeModule.forFeature([Teacher])],
})
export class TeacherModule {}