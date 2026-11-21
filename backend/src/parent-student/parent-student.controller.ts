import {
  Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Query, UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ParentStudentService } from './parent-student.service.js';
import { CreateLinkDto } from './dto/create-link.dto.js';
import { LinkQueryDto } from './dto/link-query.dto.js';
import { AuthGuard } from '../auth/guards/auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Role } from '../common/enums/role.enum.js';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface.js';

@ApiTags('Родители и дети')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Controller('parent-student')
export class ParentStudentController {
  constructor(private readonly linkService: ParentStudentService) {}

  @ApiOperation({ summary: 'Мои дети (только родитель)' })
  @Roles(Role.Parent)
  @Get('my-children') // объявлен ДО ':id'
  myChildren(@CurrentUser() user: JwtPayload) {
    return this.linkService.myChildren(user);
  }

  @ApiOperation({ summary: 'Список связей с фильтрами (только учитель)' })
  @Roles(Role.Teacher)
  @Get()
  findAll(@Query() query: LinkQueryDto) {
    return this.linkService.findAll(query);
  }

  @ApiOperation({ summary: 'Привязать родителя к ученику (только учитель)' })
  @ApiResponse({ status: 409, description: 'Такая связь уже существует' })
  @Roles(Role.Teacher)
  @Post()
  create(@Body() dto: CreateLinkDto) {
    return this.linkService.create(dto);
  }

  @ApiOperation({ summary: 'Отвязать родителя от ученика (только учитель)' })
  @Roles(Role.Teacher)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.linkService.remove(id);
  }
}