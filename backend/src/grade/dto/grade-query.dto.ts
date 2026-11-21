import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsIn, IsInt, IsOptional, IsPositive, Max, Min } from 'class-validator';
import { GradeType } from '../../common/enums/grade-type.enum.js';

/** Параметры запроса GET /api/grades */
export class GradeQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Идентификатор ученика должен быть целым числом' })
  @IsPositive({ message: 'Идентификатор ученика должен быть больше 0' })
  student_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Идентификатор назначения должен быть целым числом' })
  @IsPositive({ message: 'Идентификатор назначения должен быть больше 0' })
  assignment_id?: number;

  @IsOptional()
  @IsDateString({}, { message: 'Начальная дата должна быть в формате ГГГГ-ММ-ДД' })
  date_from?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Конечная дата должна быть в формате ГГГГ-ММ-ДД' })
  date_to?: string;

  @IsOptional()
  @IsEnum(GradeType, { message: 'Недопустимый тип работы' })
  grade_type?: GradeType;

  @IsOptional()
  @IsIn(['date_desc', 'date_asc', 'value_desc', 'value_asc'], {
    message: 'Сортировка может быть только date_desc, date_asc, value_desc или value_asc',
  })
  sort?: 'date_desc' | 'date_asc' | 'value_desc' | 'value_asc';

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Номер страницы должен быть целым числом' })
  @Min(1, { message: 'Номер страницы не может быть меньше 1' })
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Количество записей на странице должно быть целым числом' })
  @Min(1, { message: 'На странице должна быть хотя бы одна запись' })
  @Max(50, { message: 'На странице не может быть больше 50 записей' })
  limit?: number = 10;
}