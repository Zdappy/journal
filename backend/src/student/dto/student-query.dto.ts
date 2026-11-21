import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsPositive, IsString, Max, MaxLength, Min } from 'class-validator';

export class StudentQueryDto {
  /** Поиск по фамилии, имени или отчеству без учёта регистра */
  @IsOptional()
  @IsString({ message: 'Строка поиска должна быть строкой' })
  @MaxLength(60, { message: 'Строка поиска не может быть длиннее 60 символов' })
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Идентификатор класса должен быть целым числом' })
  @IsPositive({ message: 'Идентификатор класса должен быть больше 0' })
  class_id?: number;

  @IsOptional()
  @IsIn(['name_asc', 'name_desc', 'id_asc', 'id_desc'], {
    message: 'Сортировка может быть только name_asc, name_desc, id_asc или id_desc',
  })
  sort?: 'name_asc' | 'name_desc' | 'id_asc' | 'id_desc';

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