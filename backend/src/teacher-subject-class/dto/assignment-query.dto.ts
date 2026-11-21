import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsPositive, Max, Min } from 'class-validator';

/** Параметры запроса GET /api/assignments */
export class AssignmentQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Идентификатор учителя должен быть целым числом' })
  @IsPositive({ message: 'Идентификатор учителя должен быть больше 0' })
  teacher_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Идентификатор предмета должен быть целым числом' })
  @IsPositive({ message: 'Идентификатор предмета должен быть больше 0' })
  subject_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Идентификатор класса должен быть целым числом' })
  @IsPositive({ message: 'Идентификатор класса должен быть больше 0' })
  class_id?: number;

  @IsOptional()
  @IsIn(['id_asc', 'id_desc'], {
    message: 'Сортировка может быть только id_asc или id_desc',
  })
  sort?: 'id_asc' | 'id_desc';

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