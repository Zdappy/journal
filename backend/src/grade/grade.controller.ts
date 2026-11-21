import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GradeService } from './grade.service.js';
import { CreateGradeDto } from './dto/create-grade.dto.js';
import { UpdateGradeDto } from './dto/update-grade.dto.js';
import { GradeQueryDto } from './dto/grade-query.dto.js';
import { AverageQueryDto } from './dto/average-query.dto.js';
import { AuthGuard } from '../auth/guards/auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Role } from '../common/enums/role.enum.js';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface.js';

@ApiTags('Оценки')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Controller('grades')
export class GradeController {
  constructor(private readonly gradeService: GradeService) {}

  @ApiOperation({ summary: 'Список оценок: учитель — свои предметы, ученик — свои, родитель — детей' })
  @Get()
  findAll(@CurrentUser() user: JwtPayload, @Query() query: GradeQueryDto) {
    return this.gradeService.findAll(user, query);
  }

  @ApiOperation({ summary: 'Средний балл по предметам (взвешенный)' })
  @ApiResponse({ status: 400, description: 'Учителю нужно указать student_id' })
  @Get('average') // объявлен ДО ':id', иначе «average» уйдёт в ParseIntPipe
  average(@CurrentUser() user: JwtPayload, @Query() query: AverageQueryDto) {
    return this.gradeService.average(user, query.student_id);
  }

  @ApiOperation({ summary: 'Оценка по id' })
  @ApiResponse({ status: 404, description: 'Оценка не найдена или недоступна' })
  @Get(':id')
  findOne(@CurrentUser() user: JwtPayload, @Param('id', ParseIntPipe) id: number) {
    return this.gradeService.findOne(user, id);
  }

  @ApiOperation({ summary: 'Поставить оценку (только учитель, только по своему назначению)' })
  @ApiResponse({ status: 201, description: 'Оценка поставлена' })
  @ApiResponse({ status: 403, description: 'Назначение закреплено за другим учителем' })
  @Roles(Role.Teacher)
  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateGradeDto) {
    return this.gradeService.create(user, dto);
  }

  @ApiOperation({ summary: 'Изменить оценку (только учитель)' })
  @Roles(Role.Teacher)
  @Patch(':id')
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateGradeDto,
  ) {
    return this.gradeService.update(user, id, dto);
  }

  @ApiOperation({ summary: 'Удалить оценку (только учитель)' })
  @Roles(Role.Teacher)
  @Delete(':id')
  remove(@CurrentUser() user: JwtPayload, @Param('id', ParseIntPipe) id: number) {
    return this.gradeService.remove(user, id);
  }
}