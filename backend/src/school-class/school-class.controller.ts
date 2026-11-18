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
import { SchoolClassService } from './school-class.service.js';
import { CreateSchoolClassDto } from './dto/create-school-class.dto.js';
import { UpdateSchoolClassDto } from './dto/update-school-class.dto.js';
import { SchoolClassQueryDto } from './dto/school-class-query.dto.js';
import { AuthGuard } from '../auth/guards/auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { Role } from '../common/enums/role.enum.js';

@ApiTags('Классы')
@Controller('classes') // все маршруты начинаются с /api/classes
export class SchoolClassController {
  constructor(private readonly schoolClassService: SchoolClassService) {}

  @ApiOperation({
    summary: 'Список классов: поиск, фильтр по году, сортировка, постраничный вывод',
  })
  @Get()
  findAll(@Query() query: SchoolClassQueryDto) {
    return this.schoolClassService.findAll(query);
  }

  @ApiOperation({ summary: 'Класс по id: классный руководитель и список учеников' })
  @ApiResponse({ status: 404, description: 'Класс не найден' })
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.schoolClassService.findOne(id);
  }

  @ApiOperation({ summary: 'Добавление класса (только учитель)' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard, RolesGuard) // сначала проверка токена, затем роли
  @Roles(Role.Teacher)
  @ApiResponse({ status: 201, description: 'Класс добавлен' })
  @ApiResponse({ status: 401, description: 'Требуется авторизация' })
  @ApiResponse({ status: 403, description: 'Недостаточно прав' })
  @ApiResponse({ status: 404, description: 'Указанный классный руководитель не найден' })
  @ApiResponse({ status: 409, description: 'Такой класс уже есть в этом учебном году' })
  @Post()
  create(@Body() dto: CreateSchoolClassDto) {
    return this.schoolClassService.create(dto);
  }

  @ApiOperation({ summary: 'Изменение класса (только учитель)' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.Teacher)
  @ApiResponse({ status: 401, description: 'Требуется авторизация' })
  @ApiResponse({ status: 403, description: 'Недостаточно прав' })
  @ApiResponse({ status: 404, description: 'Класс или классный руководитель не найден' })
  @ApiResponse({ status: 409, description: 'Такой класс уже есть в этом учебном году' })
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateSchoolClassDto) {
    return this.schoolClassService.update(id, dto);
  }

  @ApiOperation({ summary: 'Удаление класса (только учитель)' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.Teacher)
  @ApiResponse({ status: 401, description: 'Требуется авторизация' })
  @ApiResponse({ status: 403, description: 'Недостаточно прав' })
  @ApiResponse({ status: 404, description: 'Класс не найден' })
  @ApiResponse({ status: 409, description: 'В классе есть ученики или записи журнала' })
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.schoolClassService.remove(id);
  }
}