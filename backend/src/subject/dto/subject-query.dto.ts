import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

/** Параметры запроса GET /api/subjects */
export class SubjectQueryDto {
  /** Поиск по части названия без учёта регистра */
  @IsOptional()
  @IsString({ message: 'Строка поиска должна быть строкой' })
  @MaxLength(60, { message: 'Строка поиска не может быть длиннее 60 символов' })
  search?: string;

  /** Сортировка: по названию А–Я или Я–А. Без параметра — по id */
  @IsOptional()
  @IsIn(['name_asc', 'name_desc'], {
    message: 'Сортировка может быть только name_asc или name_desc',
  })
  sort?: 'name_asc' | 'name_desc';

  @IsOptional()
  @Type(() => Number) // query-параметры приходят строками: "2" → 2
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