import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Parent } from './parent.model.js';

@Module({
  imports: [SequelizeModule.forFeature([Parent])],
})
export class ParentModule {}