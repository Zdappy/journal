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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AbsenceService } from './absence.service.js';
import { CreateAbsenceDto } from './dto/create-absence.dto.js';
import { UpdateAbsenceDto } from './dto/update-absence.dto.js';
import { AbsenceQueryDto } from './dto/absence-query.dto.js';
import { AverageQueryDto } from '../grade/dto/average-query.dto.js';
import { AuthGuard } from '../auth/guards/auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Role } from '../common/enums/role.enum.js';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface.js';

@ApiTags('Пропуски')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Controller('absences')
export class AbsenceController {
  constructor(private readonly absenceService: AbsenceService) {}

  @ApiOperation({ summary: 'Список пропусков с учётом роли пользователя' })
  @Get()
  findAll(@CurrentUser() user: JwtPayload, @Query() query: AbsenceQueryDto) {
    return this.absenceService.findAll(user, query);
  }

  @ApiOperation({ summary: 'Сводка по пропускам: всего и по типам' })
  @Get('summary') // до ':id'
  summary(@CurrentUser() user: JwtPayload, @Query() query: AverageQueryDto) {
    return this.absenceService.summary(user, query.student_id);
  }

  @ApiOperation({ summary: 'Пропуск по id' })
  @Get(':id')
  findOne(@CurrentUser() user: JwtPayload, @Param('id', ParseIntPipe) id: number) {
    return this.absenceService.findOne(user, id);
  }

  @ApiOperation({ summary: 'Отметить пропуск (только учитель)' })
  @Roles(Role.Teacher)
  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateAbsenceDto) {
    return this.absenceService.create(user, dto);
  }

  @ApiOperation({ summary: 'Изменить пропуск (только учитель)' })
  @Roles(Role.Teacher)
  @Patch(':id')
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAbsenceDto,
  ) {
    return this.absenceService.update(user, id, dto);
  }

  @ApiOperation({ summary: 'Удалить пропуск (только учитель)' })
  @Roles(Role.Teacher)
  @Delete(':id')
  remove(@CurrentUser() user: JwtPayload, @Param('id', ParseIntPipe) id: number) {
    return this.absenceService.remove(user, id);
  }
}