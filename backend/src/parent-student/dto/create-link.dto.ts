import { IsInt, IsPositive } from 'class-validator';

export class CreateLinkDto {
  @IsInt({ message: 'Идентификатор родителя должен быть целым числом' })
  @IsPositive({ message: 'Идентификатор родителя должен быть больше 0' })
  parent_id: number;

  @IsInt({ message: 'Идентификатор ученика должен быть целым числом' })
  @IsPositive({ message: 'Идентификатор ученика должен быть больше 0' })
  student_id: number;
}