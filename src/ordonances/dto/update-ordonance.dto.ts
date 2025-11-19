// src/ordonances/dto/update-ordonance.dto.ts
import { PartialType } from '@nestjs/swagger';
import { CreateOrdonanceDto } from './create-ordonance.dto';

export class UpdateOrdonanceDto extends PartialType(CreateOrdonanceDto) {}
