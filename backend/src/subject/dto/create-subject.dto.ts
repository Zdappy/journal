import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateSubjectDto {
  @IsString({ message: 'Название предмета должно быть строкой' })
  @IsNotEmpty({ message: 'Название предмета не может быть пустым' })
  @MaxLength(60, { message: 'Название предмета не может быть длиннее 60 символов' })
  name: string;

  @IsOptional()
  @IsString({ message: 'Описание должно быть строкой' })
  @MaxLength(1000, { message: 'Описание не может быть длиннее 1000 символов' })
  description?: string;
}