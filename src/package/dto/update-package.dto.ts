import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, IsBoolean, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdatePackageDto {
  @ApiPropertyOptional({ example: 'Pack Cardiologie Premium', description: 'Nom du package' })
  @IsOptional()
  @IsString()
  nom?: string;

  @ApiPropertyOptional({ example: 1, description: 'ID de la spécialité' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  specialityId?: number;

  @ApiPropertyOptional({ example: 5, description: 'Nombre de consultations incluses' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  nombreConsultations?: number;

  @ApiPropertyOptional({ example: true, description: 'Chat inclus ou non' })
  @IsOptional()
  @IsBoolean()
  chatInclus?: boolean;

  @ApiPropertyOptional({ example: true, description: 'Appel inclus ou non' })
  @IsOptional()
  @IsBoolean()
  appelInclus?: boolean;

  @ApiPropertyOptional({ example: 25000, description: 'Prix du package' })
  @IsOptional()
  @Type(() => Number)
  prix?: number;

  @ApiPropertyOptional({ example: 30, description: 'Durée de validité en jours' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  dureeValiditeJours?: number;

  @ApiPropertyOptional({ example: true, description: 'Actif ou non' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}