import {
  Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Query, UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { StudentService } from './student.service.js';
import { StudentQueryDto } from './dto/student-query.dto.js';
import { UpdateStudentDto } from './dto/update-student.dto.js';
import { AuthGuard } from '../auth/guards/auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Role } from '../common/enums/role.enum.js';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface.js';

@ApiTags('Ученики')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Controller('students')
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  @ApiOperation({ summary: 'Список учеников: поиск по ФИО, фильтр по классу (только учитель)' })
  @Roles(Role.Teacher)
  @Get()
  findAll(@Query() query: StudentQueryDto) {
    return this.studentService.findAll(query);
  }

  @ApiOperation({ summary: 'Ученик по id: учитель — любой, ученик — себя, родитель — своих детей' })
  @ApiResponse({ status: 404, description: 'Ученик не найден или недоступен' })
  @Get(':id')
  findOne(@CurrentUser() user: JwtPayload, @Param('id', ParseIntPipe) id: number) {
    return this.studentService.findOne(user, id);
  }

  @ApiOperation({ summary: 'Изменение ученика: перевод в другой класс, правка ФИО (только учитель)' })
  @Roles(Role.Teacher)
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateStudentDto) {
    return this.studentService.update(id, dto);
  }

  @ApiOperation({ summary: 'Удаление ученика (только учитель)' })
  @ApiResponse({ status: 409, description: 'По ученику есть оценки или пропуски' })
  @Roles(Role.Teacher)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.studentService.remove(id);
  }
}