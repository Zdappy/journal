import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UserService } from '../user/user.service.js';
import { Role } from '../common/enums/role.enum.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import type { JwtPayload } from './interfaces/jwt-payload.interface.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Открытая регистрация: роль всегда Родитель, подменить её нельзя.
   * Переиспользуем createUser: права проверяет контроллер (@Roles), а не сервис.
   */
  register(dto: RegisterDto) {
    return this.createUser({
      username: dto.username,
      password: dto.password,
      role: Role.Parent,
      lastname: dto.lastname,
      firstname: dto.firstname,
      middlename: dto.middlename,
      phone: dto.phone,
      email: dto.email,
    });
  }

  /** Создание аккаунта учителем: роль задаёт учитель */
  async createUser(dto: CreateUserDto) {
    // 10 — «стоимость» хеширования (2^10 раундов)
    const passwordHash = await bcrypt.hash(dto.password, 10);

    // Поля перечислены явно: spread на экземпляре класса DTO теряет прототип
    return this.userService.createWithProfile({
      username: dto.username,
      password: passwordHash,
      role: dto.role,
      lastname: dto.lastname,
      firstname: dto.firstname,
      middlename: dto.middlename,
      phone: dto.phone,
      email: dto.email,
      class_id: dto.class_id,
    });
  }

  /** Вход: проверка пароля и выдача токена */
  async login(dto: LoginDto) {
    const user = await this.userService.findByUsernameWithPassword(dto.username);

    // Одинаковое сообщение для «нет такого логина» и «неверный пароль»,
    // чтобы нельзя было перебором узнать существующие логины
    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('Неверный логин или пароль');
    }

    const payload: JwtPayload = {
      sub: user.id,
      username: user.username,
      role: user.role,
    };

    return { access_token: await this.jwtService.signAsync(payload) };
  }
}