import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { TeacherSubjectClassService } from './teacher-subject-class.service.js';
import { JournalAccessService } from '../journal-access/journal-access.service.js';
import { CreateAssignmentDto } from './dto/create-assignment.dto.js';
import { AssignmentQueryDto } from './dto/assignment-query.dto.js';
import { AuthGuard } from '../auth/guards/auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Role } from '../common/enums/role.enum.js';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface.js';

@ApiTags('Назначения')
@Controller('assignments')
export class TeacherSubjectClassController {
  constructor(
    private readonly assignmentService: TeacherSubjectClassService,
    private readonly access: JournalAccessService,
  ) {}

  @ApiOperation({ summary: 'Мои назначения: предметы и классы текущего учителя' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.Teacher)
  @Get('my') // объявлен ДО ':id', иначе «my» уйдёт в ParseIntPipe и вернёт 400
  async findMy(@CurrentUser() user: JwtPayload) {
    const teacherId = await this.access.teacherIdOf(user);
    return this.assignmentService.findMy(teacherId);
  }

  @ApiOperation({ summary: 'Список назначений: фильтры по учителю, предмету, классу' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get()
  findAll(@Query() query: AssignmentQueryDto) {
    return this.assignmentService.findAll(query);
  }

  @ApiOperation({ summary: 'Назначение по id' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @ApiResponse({ status: 404, description: 'Назначение не найдено' })
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.assignmentService.findOne(id);
  }

  @ApiOperation({ summary: 'Назначить учителю предмет в классе (только учитель)' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.Teacher)
  @ApiResponse({ status: 201, description: 'Назначение создано' })
  @ApiResponse({ status: 404, description: 'Учитель, предмет или класс не найден' })
  @ApiResponse({ status: 409, description: 'Такое назначение уже существует' })
  @Post()
  create(@Body() dto: CreateAssignmentDto) {
    return this.assignmentService.create(dto);
  }

  @ApiOperation({ summary: 'Удалить назначение (только учитель)' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.Teacher)
  @ApiResponse({ status: 409, description: 'По назначению есть оценки или пропуски' })
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.assignmentService.remove(id);
  }
}