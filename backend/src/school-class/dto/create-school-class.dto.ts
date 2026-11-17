import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateSchoolClassDto {
  /** Название класса в формате «5А», «10Б» */
  @IsString({ message: 'Название класса должно быть строкой' })
  @IsNotEmpty({ message: 'Название класса не может быть пустым' })
  @MaxLength(10, { message: 'Название класса не может быть длиннее 10 символов' })
  @Matches(/^\d{1,2}[А-ЯЁ]$/, {
    message: 'Название класса должно быть в формате «5А» или «10Б»: число и заглавная русская буква',
  })
  name: string;

  /** Учебный год, например 2026 */
  @IsInt({ message: 'Учебный год должен быть целым числом' })
  @Min(2000, { message: 'Учебный год не может быть меньше 2000' })
  @Max(2100, { message: 'Учебный год не может быть больше 2100' })
  academic_year: number;

  /** Классный руководитель. Можно не указывать или передать null */
  @IsOptional()
  @IsInt({ message: 'Идентификатор классного руководителя должен быть целым числом' })
  @IsPositive({ message: 'Идентификатор классного руководителя должен быть больше 0' })
  homeroom_teacher_id?: number | null;

  /** Дата начала обучения в формате ГГГГ-ММ-ДД */
  @IsOptional()
  @IsDateString({}, { message: 'Дата начала обучения должна быть в формате ГГГГ-ММ-ДД' })
  started_at?: string | null;
}