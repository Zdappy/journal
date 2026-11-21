import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';

export class ImportQueryDto {
  @Type(() => Number)
  @IsInt({ message: 'Учебный год должен быть целым числом' })
  @Min(2000, { message: 'Учебный год не может быть меньше 2000' })
  @Max(2100, { message: 'Учебный год не может быть больше 2100' })
  academic_year: number;
}