import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, IsBoolean, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class PackageQueryDto {
  @ApiPropertyOptional({ example: 'Cardiologie', description: 'Recherche par nom' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: 1, description: 'Filtrer par spécialité' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  specialityId?: number;

  @ApiPropertyOptional({ example: true, description: 'Filtrer par statut actif/inactif' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

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