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
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SchoolClassService } from './school-class.service.js';
import { CreateSchoolClassDto } from './dto/create-school-class.dto.js';
import { UpdateSchoolClassDto } from './dto/update-school-class.dto.js';
import { SchoolClassQueryDto } from './dto/school-class-query.dto.js';

@ApiTags('Классы')
@Controller('classes') // все маршруты начинаются с /api/classes
export class SchoolClassController {
  constructor(private readonly schoolClassService: SchoolClassService) {}

  @ApiOperation({ summary: 'Список классов: поиск, фильтр по году, сортировка, постраничный вывод' })
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

  @ApiOperation({ summary: 'Добавление класса' })
  @ApiResponse({ status: 201, description: 'Класс добавлен' })
  @ApiResponse({ status: 404, description: 'Указанный классный руководитель не найден' })
  @ApiResponse({ status: 409, description: 'Такой класс уже есть в этом учебном году' })
  @Post()
  create(@Body() dto: CreateSchoolClassDto) {
    return this.schoolClassService.create(dto);
  }

  @ApiOperation({ summary: 'Изменение класса' })
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateSchoolClassDto) {
    return this.schoolClassService.update(id, dto);
  }

  @ApiOperation({ summary: 'Удаление класса' })
  @ApiResponse({ status: 409, description: 'В классе есть ученики или записи журнала' })
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.schoolClassService.remove(id);
  }
}