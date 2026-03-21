import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class HopitalQueryDto {
  @ApiPropertyOptional({ example: 'Central', description: 'Recherche par nom' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: 'Yaoundé', description: 'Filtrer par ville' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 1, description: 'Numéro de page' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 20, description: 'Nombre d\'éléments par page' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}