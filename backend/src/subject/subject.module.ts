import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Subject } from './subject.model.js';

@Module({
  imports: [SequelizeModule.forFeature([Subject])],
})
export class SubjectModule {}