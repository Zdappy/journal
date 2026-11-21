import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ReportService } from './report.service.js';
import { AverageQueryDto } from '../grade/dto/average-query.dto.js';
import { AuthGuard } from '../auth/guards/auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Role } from '../common/enums/role.enum.js';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface.js';

@ApiTags('Отчёты')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Controller('reports')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @ApiOperation({
    summary: 'Отчёт об успеваемости: средний балл по предметам и пропуски по каждому ребёнку',
  })
  @ApiResponse({ status: 200, description: 'Отчёт сформирован' })
  @ApiResponse({ status: 403, description: 'Ученику отчёт недоступен — смотрите /grades/average' })
  @Roles(Role.Parent, Role.Teacher)
  @Get('parent')
  forParent(@CurrentUser() user: JwtPayload, @Query() query: AverageQueryDto) {
    return this.reportService.forParent(user, query.student_id);
  }
}