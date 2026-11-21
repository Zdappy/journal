import {
  Controller,
  FileTypeValidator,
  MaxFileSizeValidator,
  ParseFilePipe,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ImportService } from './import.service.js';
import { ImportQueryDto } from './dto/import-query.dto.js';
import { AuthGuard } from '../auth/guards/auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Role } from '../common/enums/role.enum.js';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface.js';

@ApiTags('Импорт')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Roles(Role.Teacher)
@Controller('import')
export class ImportController {
  constructor(private readonly importService: ImportService) {}

  @ApiOperation({ summary: 'Импорт оценок из таблицы Excel (только учитель)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
      required: ['file'],
    },
  })
  @Post('grades')
  @UseInterceptors(FileInterceptor('file'))
  importGrades(
    @CurrentUser() user: JwtPayload,
    @Query() query: ImportQueryDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({
            maxSize: 5 * 1024 * 1024,
            message: 'Размер файла не должен превышать 5 МБ',
          }),
          // XLSX — это ZIP-архив, его сигнатура начинается с байтов PK (50 4B)
          new FileTypeValidator({ fileType: /^application\/(vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet|zip)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.importService.importGrades(user, file, query.academic_year);
  }
}