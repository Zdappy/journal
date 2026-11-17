import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

/** Параметры запроса GET /api/classes */
export class SchoolClassQueryDto {
  /** Поиск по части названия класса */
  @IsOptional()
  @IsString({ message: 'Строка поиска должна быть строкой' })
  @MaxLength(10, { message: 'Строка поиска не может быть длиннее 10 символов' })
  search?: string;

  /** Только классы указанного учебного года */
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Учебный год должен быть целым числом' })
  @Min(2000, { message: 'Учебный год не может быть меньше 2000' })
  @Max(2100, { message: 'Учебный год не может быть больше 2100' })
  academic_year?: number;

  @IsOptional()
  @IsIn(['name_asc', 'name_desc', 'year_asc', 'year_desc'], {
    message: 'Сортировка может быть только name_asc, name_desc, year_asc или year_desc',
  })
  sort?: 'name_asc' | 'name_desc' | 'year_asc' | 'year_desc';

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