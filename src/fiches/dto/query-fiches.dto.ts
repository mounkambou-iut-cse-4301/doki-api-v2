import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class QueryFichesDto {
  @ApiPropertyOptional({ description: 'Recherche plein texte sur title/description' })
  @IsOptional() @IsString()
  q?: string;

  @ApiPropertyOptional({ description: 'Filtrer par créateur (ex: admin id=5)' })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  createdBy?: number;

  @ApiPropertyOptional({ description: 'Filtrer par statut actif/inactif' })
  @IsOptional() @Type(() => Boolean) @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  limit?: number = 20;
}
