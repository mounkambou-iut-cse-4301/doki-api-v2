// src/protocoles-ordonance/dto/query-protocole-ordonance.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString } from 'class-validator';

export class QueryProtocoleOrdonanceDto {
  @ApiPropertyOptional({ description: 'Recherche par nom de maladie (name)' })
  @IsOptional() @IsString()
  q?: string;

  @ApiPropertyOptional({ description: 'Page', default: 1 })
  @IsOptional() @IsInt()
  page?: number;

  @ApiPropertyOptional({ description: 'Taille page', default: 10 })
  @IsOptional() @IsInt()
  limit?: number;
}
