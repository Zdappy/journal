import { PartialType } from '@nestjs/swagger';
import { CreateAbsenceDto } from './create-absence.dto.js';

export class UpdateAbsenceDto extends PartialType(CreateAbsenceDto) {}