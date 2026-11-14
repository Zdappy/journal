import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Grade } from './grade.model.js';

@Module({
  imports: [SequelizeModule.forFeature([Grade])],
})
export class GradeModule {}