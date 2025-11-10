// src/protocoles-ordonance/dto/update-protocole-ordonance.dto.ts
import { PartialType } from '@nestjs/swagger';
import { CreateProtocoleOrdonanceDto } from './create-protocole-ordonance.dto';

export class UpdateProtocoleOrdonanceDto extends PartialType(CreateProtocoleOrdonanceDto) {}
