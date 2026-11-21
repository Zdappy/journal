import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsPositive } from 'class-validator';

/** Параметры GET /api/grades/average */
export class AverageQueryDto {
  /** Ученик: свой — по умолчанию, родитель может указать любого из своих детей */
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Идентификатор ученика должен быть целым числом' })
  @IsPositive({ message: 'Идентификатор ученика должен быть больше 0' })
  student_id?: number;
}