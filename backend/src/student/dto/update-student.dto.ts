import {
  IsDateString, IsInt, IsNotEmpty, IsOptional, IsPositive, IsString, MaxLength,
} from 'class-validator';

export class UpdateStudentDto {
  /** Перевод в другой класс */
  @IsOptional()
  @IsInt({ message: 'Идентификатор класса должен быть целым числом' })
  @IsPositive({ message: 'Идентификатор класса должен быть больше 0' })
  class_id?: number;

  @IsOptional()
  @IsDateString({}, { message: 'Дата рождения должна быть в формате ГГГГ-ММ-ДД' })
  birth_date?: string | null;

  @IsOptional()
  @IsDateString({}, { message: 'Дата зачисления должна быть в формате ГГГГ-ММ-ДД' })
  enrolled_at?: string | null;

  @IsOptional()
  @IsString({ message: 'Фамилия должна быть строкой' })
  @IsNotEmpty({ message: 'Фамилия не может быть пустой' })
  @MaxLength(30, { message: 'Фамилия не может быть длиннее 30 символов' })
  lastname?: string;

  @IsOptional()
  @IsString({ message: 'Имя должно быть строкой' })
  @IsNotEmpty({ message: 'Имя не может быть пустым' })
  @MaxLength(30, { message: 'Имя не может быть длиннее 30 символов' })
  firstname?: string;

  @IsOptional()
  @IsString({ message: 'Отчество должно быть строкой' })
  @MaxLength(30, { message: 'Отчество не может быть длиннее 30 символов' })
  middlename?: string | null;
}