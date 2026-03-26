import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsInt, Min, IsDateString, IsString, IsEnum } from 'class-validator';
import { AbonnementStatus } from 'generated/prisma';

export class QueryAbonnementDto {
  @ApiPropertyOptional({ description: 'Filtrer par patient (ID)' })
  @IsOptional() 
  @Type(() => Number) 
  @IsInt() 
  @Min(1)
  patientId?: number;

  @ApiPropertyOptional({ description: 'Filtrer par package (ID)' })
  @IsOptional() 
  @Type(() => Number) 
  @IsInt() 
  @Min(1)
  packageId?: number;

  @ApiPropertyOptional({ description: 'Filtrer par spécialité (ID)' })
  @IsOptional() 
  @Type(() => Number) 
  @IsInt() 
  @Min(1)
  specialityId?: number;

  @ApiPropertyOptional({ description: 'Filtrer par statut', enum: AbonnementStatus })
  @IsOptional()
  @IsEnum(AbonnementStatus)
  status?: AbonnementStatus;

  @ApiPropertyOptional({ description: 'Filtrer par date de début (YYYY-MM-DD)' })
  @IsOptional() 
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({ description: 'Recherche (noms patient)' })
  @IsOptional() 
  @IsString()
  q?: string;

  @ApiPropertyOptional({ description: 'Uniquement les abonnements actifs (endDate >= aujourd\'hui)' })
  @IsOptional()
  @Type(() => Boolean)
  active?: boolean;

  @ApiPropertyOptional({ description: 'Page (>=1)', default: 1 })
  @IsOptional() 
  @Type(() => Number) 
  @IsInt() 
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Limite (1–100)', default: 10 })
  @IsOptional() 
  @Type(() => Number) 
  @IsInt() 
  @Min(1)
  limit?: number = 10;
}