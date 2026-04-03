import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { CibleAudiencePublicite } from 'generated/prisma';

export class PackagePubliciteQueryDto {
  @ApiPropertyOptional({
    example: 'Pack Mixte',
    description: 'Recherche par nom ou description',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    enum: CibleAudiencePublicite,
    example: CibleAudiencePublicite.LES_DEUX,
    description: 'Filtrer par cible audience',
  })
  @IsOptional()
  @IsEnum(CibleAudiencePublicite)
  cibleAudience?: CibleAudiencePublicite;

  @ApiPropertyOptional({
    example: true,
    description: 'Filtrer par statut actif/inactif',
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  actif?: boolean;

  @ApiPropertyOptional({
    example: 10000,
    description: 'Montant minimum',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  montantMin?: number;

  @ApiPropertyOptional({
    example: 50000,
    description: 'Montant maximum',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  montantMax?: number;

  @ApiPropertyOptional({
    example: 3,
    description: 'Durée minimum en jours',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  dureeJoursMin?: number;

  @ApiPropertyOptional({
    example: 30,
    description: 'Durée maximum en jours',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  dureeJoursMax?: number;

  @ApiPropertyOptional({
    example: 1,
    description: 'Numéro de page',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    example: 20,
    description: "Nombre d'éléments par page",
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}