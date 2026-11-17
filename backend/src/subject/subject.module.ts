import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Subject } from './subject.model.js';
import { SubjectController } from './subject.controller.js';
import { SubjectService } from './subject.service.js';

@Module({
  imports: [SequelizeModule.forFeature([Subject])],
  controllers: [SubjectController],
  providers: [SubjectService],
})
export class SubjectModule {}