import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { CibleAudiencePublicite, StatutPublicite } from 'generated/prisma';

export class AdminPubliciteQueryDto {
  @ApiPropertyOptional({ example: 'cardiologie' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    enum: StatutPublicite,
    example: StatutPublicite.ACTIVE,
  })
  @IsOptional()
  @IsEnum(StatutPublicite)
  statut?: StatutPublicite;

  @ApiPropertyOptional({
    enum: CibleAudiencePublicite,
    example: CibleAudiencePublicite.LES_DEUX,
  })
  @IsOptional()
  @IsEnum(CibleAudiencePublicite)
  cibleAudience?: CibleAudiencePublicite;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  packagePubliciteId?: number;

  @ApiPropertyOptional({ example: 7 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  televerseParId?: number;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  annonceurUtilisateurId?: number;

  @ApiPropertyOptional({
    example: '2026-04-01T00:00:00.000Z',
    description: 'Filtrer les pubs dont dateDebut >= cette date',
  })
  @IsOptional()
  @IsDateString()
  dateDebutMin?: string;

  @ApiPropertyOptional({
    example: '2026-04-30T23:59:59.999Z',
    description: 'Filtrer les pubs dont dateDebut <= cette date',
  })
  @IsOptional()
  @IsDateString()
  dateDebutMax?: string;

  @ApiPropertyOptional({
    example: '2026-04-01T00:00:00.000Z',
    description: 'Filtrer les pubs dont dateFin >= cette date',
  })
  @IsOptional()
  @IsDateString()
  dateFinMin?: string;

  @ApiPropertyOptional({
    example: '2026-04-30T23:59:59.999Z',
    description: 'Filtrer les pubs dont dateFin <= cette date',
  })
  @IsOptional()
  @IsDateString()
  dateFinMax?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}