// src/videos/dto/query-video.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsInt, Min, IsString, IsDateString, MaxLength } from 'class-validator';

export class QueryVideoDto {
   @ApiPropertyOptional({ description: 'Recherche (titre, description, catégorie)' })
  @IsOptional() @IsString()
  q?: string;

  @ApiPropertyOptional({ description: 'Filtrer par médecin (ID)' })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  medecinId?: number;

  @ApiPropertyOptional({ description: 'Filtrer par catégorie (insensible à la casse)' })
  @IsOptional() @IsString() @MaxLength(100)
  category?: string;

  @ApiPropertyOptional({ description: 'Filtrer par date (YYYY-MM-DD) sur createdAt (journée entière)' })
  @IsOptional() @IsDateString()
  date?: string;

  @ApiPropertyOptional({ description: 'Page (>=1)', default: 1 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Limite (>=1)', default: 10 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  limit?: number = 10;
}