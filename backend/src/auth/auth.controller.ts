import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service.js';
import { UserService } from '../user/user.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { AuthGuard } from './guards/auth.guard.js';
import { RolesGuard } from './guards/roles.guard.js';
import { Roles } from './decorators/roles.decorator.js';
import { CurrentUser } from './decorators/current-user.decorator.js';
import { Role } from '../common/enums/role.enum.js';
import type { JwtPayload } from './interfaces/jwt-payload.interface.js';

@ApiTags('Аутентификация')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @ApiOperation({ summary: 'Регистрация родителя (доступна всем)' })
  @ApiResponse({ status: 201, description: 'Родитель зарегистрирован' })
  @ApiResponse({ status: 409, description: 'Логин уже занят' })
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @ApiOperation({ summary: 'Создание аккаунта учителя / ученика / родителя (только учитель)' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.Teacher)
  @Post('users')
  createUser(@Body() dto: CreateUserDto) {
    return this.authService.createUser(dto);
  }

  @ApiOperation({ summary: 'Вход: возвращает токен доступа' })
  @HttpCode(HttpStatus.OK) // вход не создаёт запись, поэтому 200, а не 201
  @ApiResponse({ status: 401, description: 'Неверный логин или пароль' })
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @ApiOperation({ summary: 'Данные текущего пользователя и его профиль роли' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get('profile')
  profile(@CurrentUser() user: JwtPayload) {
    return this.userService.findById(user.sub);
  }
}