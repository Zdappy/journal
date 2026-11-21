import { Controller, Get, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ParentService } from './parent.service.js';
import { ParentQueryDto } from './dto/parent-query.dto.js';
import { AuthGuard } from '../auth/guards/auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { Role } from '../common/enums/role.enum.js';

@ApiTags('Родители')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Roles(Role.Teacher)
@Controller('parents')
export class ParentController {
  constructor(private readonly parentService: ParentService) {}

  @ApiOperation({ summary: 'Список родителей с поиском по ФИО (только учитель)' })
  @Get()
  findAll(@Query() query: ParentQueryDto) {
    return this.parentService.findAll(query);
  }

  @ApiOperation({ summary: 'Родитель по id со списком детей (только учитель)' })
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.parentService.findOne(id);
  }
}