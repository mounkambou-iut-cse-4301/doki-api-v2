import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsInt, Min, IsDateString } from 'class-validator';

export class QueryAbonnementDto {
  @ApiPropertyOptional({ description: 'Filtrer par médecin (ID)' })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  medecinId?: number;

  @ApiPropertyOptional({ description: 'Filtrer par patient (ID)' })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  patientId?: number;

  @ApiPropertyOptional({ description: 'Filtrer par date de début (YYYY-MM-DD)' })
  @IsOptional() @IsDateString()
  date?: string;

  @ApiPropertyOptional({ description: 'Page (>=1)', default: 1 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Limite (1–100)', default: 10 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  limit?: number = 10;
}