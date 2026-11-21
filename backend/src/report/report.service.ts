import { Injectable } from '@nestjs/common';
import { GradeService, type SubjectAverage } from '../grade/grade.service.js';
import { AbsenceService, type AbsenceSummary } from '../absence/absence.service.js';
import { JournalAccessService } from '../journal-access/journal-access.service.js';
import { AbsenceType } from '../common/enums/absence-type.enum.js';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface.js';

/** Отчёт об успеваемости одного ученика */
export interface StudentReport {
  student_id: number;
  student_name: string;
  class_name: string | null;
  /** Общий средний балл по всем предметам (взвешенный) */
  overall_average: number | null;
  subjects: SubjectAverage[];
  absences: AbsenceSummary;
}

/**
 * Ключевая функция темы: сводка для родителя.
 * Собирает средние баллы и пропуски по каждому ребёнку.
 * Права проверяются сервисами оценок и пропусков — родитель получит
 * данные только по своим детям.
 */
@Injectable()
export class ReportService {
  constructor(
    private readonly gradeService: GradeService,
    private readonly absenceService: AbsenceService,
    private readonly access: JournalAccessService,
  ) {}

  async forParent(user: JwtPayload, studentId?: number): Promise<StudentReport[]> {
    const averages = await this.gradeService.average(user, studentId);
    const summaries = await this.absenceService.summary(user, studentId);

    return averages.map((average) => {
      const absences = summaries.find((s) => s.student_id === average.student_id) ?? {
        student_id: average.student_id,
        total: 0,
        by_type: {
          [AbsenceType.Illness]: 0,
          [AbsenceType.Valid]: 0,
          [AbsenceType.Invalid]: 0,
          [AbsenceType.Lateness]: 0,
        } as Record<AbsenceType, number>,
      };

      return {
        student_id: average.student_id,
        student_name: average.student_name,
        class_name: average.class_name,
        overall_average: this.overallAverage(average.subjects),
        subjects: average.subjects,
        absences,
      };
    });
  }

  /** Общий балл: сумма (балл × вес предмета) / сумма весов */
  private overallAverage(subjects: SubjectAverage[]): number | null {
    const weight = subjects.reduce((sum, s) => sum + s.total_weight, 0);
    if (weight === 0) {
      return null;
    }
    const points = subjects.reduce((sum, s) => sum + (s.average ?? 0) * s.total_weight, 0);
    return Math.round((points / weight) * 100) / 100;
  }
}