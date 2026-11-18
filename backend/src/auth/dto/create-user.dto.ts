import {
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Role } from '../../common/enums/role.enum.js';

/** Создание аккаунта учителем: роль указывает учитель, а не сам пользователь */
export class CreateUserDto {
  @IsString({ message: 'Логин должен быть строкой' })
  @MinLength(3, { message: 'Логин должен содержать не менее 3 символов' })
  @MaxLength(50, { message: 'Логин не может быть длиннее 50 символов' })
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'Логин может содержать только латинские буквы, цифры и подчёркивание',
  })
  username: string;

  @IsString({ message: 'Пароль должен быть строкой' })
  @MinLength(6, { message: 'Пароль должен содержать не менее 6 символов' })
  @MaxLength(50, { message: 'Пароль не может быть длиннее 50 символов' })
  password: string;

  @IsEnum(Role, { message: 'Роль может быть только Учитель, Ученик или Родитель' })
  role: Role;

  @IsString({ message: 'Фамилия должна быть строкой' })
  @IsNotEmpty({ message: 'Укажите фамилию' })
  @MaxLength(30, { message: 'Фамилия не может быть длиннее 30 символов' })
  lastname: string;

  @IsString({ message: 'Имя должно быть строкой' })
  @IsNotEmpty({ message: 'Укажите имя' })
  @MaxLength(30, { message: 'Имя не может быть длиннее 30 символов' })
  firstname: string;

  @IsOptional()
  @IsString({ message: 'Отчество должно быть строкой' })
  @MaxLength(30, { message: 'Отчество не может быть длиннее 30 символов' })
  middlename?: string;

  @IsOptional()
  @IsString({ message: 'Телефон должен быть строкой' })
  @MaxLength(20, { message: 'Телефон не может быть длиннее 20 символов' })
  phone?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Некорректный адрес электронной почты' })
  @MaxLength(100, { message: 'Адрес почты не может быть длиннее 100 символов' })
  email?: string;

  /** Обязателен для роли Ученик */
  @IsOptional()
  @IsInt({ message: 'Идентификатор класса должен быть целым числом' })
  @IsPositive({ message: 'Идентификатор класса должен быть больше 0' })
  class_id?: number;
}