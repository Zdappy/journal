import { IsDateString, IsEnum, IsInt, IsOptional, IsPositive, IsString, Max, MaxLength, Min } from 'class-validator';
import { GradeType } from '../../common/enums/grade-type.enum.js';

export class CreateGradeDto {
  @IsInt({ message: 'Идентификатор ученика должен быть целым числом' })
  @IsPositive({ message: 'Идентификатор ученика должен быть больше 0' })
  student_id: number;

  /** Назначение «учитель + предмет + класс» — из списка GET /api/assignments/my */
  @IsInt({ message: 'Идентификатор назначения должен быть целым числом' })
  @IsPositive({ message: 'Идентификатор назначения должен быть больше 0' })
  assignment_id: number;

  @IsInt({ message: 'Оценка должна быть целым числом' })
  @Min(1, { message: 'Оценка не может быть меньше 1' })
  @Max(5, { message: 'Оценка не может быть больше 5' })
  value: number;

  @IsDateString({}, { message: 'Дата занятия должна быть в формате ГГГГ-ММ-ДД' })
  lesson_date: string;

  @IsOptional()
  @IsEnum(GradeType, { message: 'Недопустимый тип работы' })
  grade_type?: GradeType;

  @IsOptional()
  @IsString({ message: 'Комментарий должен быть строкой' })
  @MaxLength(255, { message: 'Комментарий не может быть длиннее 255 символов' })
  comment?: string;
}