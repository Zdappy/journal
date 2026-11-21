import { IsDateString, IsEnum, IsInt, IsOptional, IsPositive, IsString, MaxLength } from 'class-validator';
import { AbsenceType } from '../../common/enums/absence-type.enum.js';

export class CreateAbsenceDto {
  @IsInt({ message: 'Идентификатор ученика должен быть целым числом' })
  @IsPositive({ message: 'Идентификатор ученика должен быть больше 0' })
  student_id: number;

  @IsInt({ message: 'Идентификатор назначения должен быть целым числом' })
  @IsPositive({ message: 'Идентификатор назначения должен быть больше 0' })
  assignment_id: number;

  @IsDateString({}, { message: 'Дата занятия должна быть в формате ГГГГ-ММ-ДД' })
  lesson_date: string;

  @IsOptional()
  @IsEnum(AbsenceType, { message: 'Недопустимый тип пропуска' })
  absence_type?: AbsenceType;

  @IsOptional()
  @IsString({ message: 'Причина должна быть строкой' })
  @MaxLength(255, { message: 'Причина не может быть длиннее 255 символов' })
  reason?: string;
}