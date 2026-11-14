import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { SchoolClass } from './school-class.model.js';

@Module({
  imports: [SequelizeModule.forFeature([SchoolClass])],
})
export class SchoolClassModule {}