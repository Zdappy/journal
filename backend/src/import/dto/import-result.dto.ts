/** Результат импорта оценок */
export class ImportResultDto {
  imported: number;
  academic_year: number;
}

/** Ошибка в конкретной строке таблицы */
export interface ImportRowError {
  row: number;
  student: string;
  message: string;
}