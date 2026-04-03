import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { CibleAudiencePublicite } from 'generated/prisma';

export class CreatePackagePubliciteDto {
  @ApiProperty({ example: 'Pack Mixte 7 jours' })
  @IsNotEmpty()
  @IsString()
  nom: string;

  @ApiPropertyOptional({
    example: 'Pack pour afficher une publicité pendant 7 jours',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 7 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  dureeJours: number;

  @ApiProperty({ example: 25000 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  montant: number;

  @ApiProperty({
    enum: CibleAudiencePublicite,
    example: CibleAudiencePublicite.LES_DEUX,
  })
  @IsEnum(CibleAudiencePublicite)
  cibleAudience: CibleAudiencePublicite;

  @ApiProperty({ example: 5 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  nombreMaxImages: number;

  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  nombreMaxVideos: number;

  @ApiProperty({ example: 30, description: 'Maximum absolu: 30 secondes' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(30)
  dureeMaxVideoSecondes: number;
}