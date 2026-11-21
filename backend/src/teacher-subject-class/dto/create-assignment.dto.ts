import { IsInt, IsPositive } from 'class-validator';

export class CreateAssignmentDto {
  @IsInt({ message: 'Идентификатор учителя должен быть целым числом' })
  @IsPositive({ message: 'Идентификатор учителя должен быть больше 0' })
  teacher_id: number;

  @IsInt({ message: 'Идентификатор предмета должен быть целым числом' })
  @IsPositive({ message: 'Идентификатор предмета должен быть больше 0' })
  subject_id: number;

  @IsInt({ message: 'Идентификатор класса должен быть целым числом' })
  @IsPositive({ message: 'Идентификатор класса должен быть больше 0' })
  class_id: number;
}