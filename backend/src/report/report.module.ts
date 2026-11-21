import { Module } from '@nestjs/common';
import { GradeModule } from '../grade/grade.module.js';
import { AbsenceModule } from '../absence/absence.module.js';
import { JournalAccessModule } from '../journal-access/journal-access.module.js';
import { ReportController } from './report.controller.js';
import { ReportService } from './report.service.js';

@Module({
  imports: [GradeModule, AbsenceModule, JournalAccessModule],
  controllers: [ReportController],
  providers: [ReportService],
})
export class ReportModule {}