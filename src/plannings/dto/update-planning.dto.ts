// src/planning/dto/update-planning.dto.ts
import { PartialType } from '@nestjs/swagger';
import { CreatePlanningDto } from './create-planning.dto';

export class UpdatePlanningDto extends PartialType(CreatePlanningDto) {}
