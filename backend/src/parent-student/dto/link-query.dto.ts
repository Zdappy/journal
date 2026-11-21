import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsPositive } from 'class-validator';

export class LinkQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Идентификатор родителя должен быть целым числом' })
  @IsPositive({ message: 'Идентификатор родителя должен быть больше 0' })
  parent_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Идентификатор ученика должен быть целым числом' })
  @IsPositive({ message: 'Идентификатор ученика должен быть больше 0' })
  student_id?: number;
}