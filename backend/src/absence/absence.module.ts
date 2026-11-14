import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Absence } from './absence.model.js';

@Module({
  imports: [SequelizeModule.forFeature([Absence])],
})
export class AbsenceModule {}