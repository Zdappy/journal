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
import { SubjectService } from './subject.service.js';
import { CreateSubjectDto } from './dto/create-subject.dto.js';
import { UpdateSubjectDto } from './dto/update-subject.dto.js';
import { SubjectQueryDto } from './dto/subject-query.dto.js';

@ApiTags('Предметы')
@Controller('subjects') // все маршруты начинаются с /api/subjects
export class SubjectController {
  constructor(private readonly subjectService: SubjectService) {}

  @ApiOperation({ summary: 'Список предметов: поиск, сортировка, постраничный вывод' })
  @Get()
  findAll(@Query() query: SubjectQueryDto) {
    return this.subjectService.findAll(query);
  }

  @ApiOperation({ summary: 'Получение предмета по id' })
  @ApiResponse({ status: 404, description: 'Предмет не найден' })
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.subjectService.findOne(id);
  }

  @ApiOperation({ summary: 'Добавление предмета' })
  @ApiResponse({ status: 201, description: 'Предмет добавлен' })
  @ApiResponse({ status: 409, description: 'Предмет с таким названием уже существует' })
  @Post()
  create(@Body() dto: CreateSubjectDto) {
    return this.subjectService.create(dto);
  }

  @ApiOperation({ summary: 'Изменение предмета' })
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateSubjectDto) {
    return this.subjectService.update(id, dto);
  }

  @ApiOperation({ summary: 'Удаление предмета' })
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.subjectService.remove(id);
  }
}