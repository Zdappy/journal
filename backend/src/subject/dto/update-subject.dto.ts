import { PartialType } from '@nestjs/swagger';
import { CreateSubjectDto } from './create-subject.dto.js';

// PartialType делает все поля необязательными, сохраняя правила валидации.
// Импортируем именно из @nestjs/swagger — тогда поля корректно попадут в документацию
export class UpdateSubjectDto extends PartialType(CreateSubjectDto) {}