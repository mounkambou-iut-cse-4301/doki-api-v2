import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min, IsString } from 'class-validator';

export class QuerySpecialityDto {
  @ApiPropertyOptional({ description: 'Recherche (nom spécialité)' })
  @IsOptional() @IsString()
  q?: string;

  @ApiPropertyOptional({ description: 'Page (>=1)', default: 1 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Limite (1–100)', default: 10 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100)
  limit?: number = 10;
}
