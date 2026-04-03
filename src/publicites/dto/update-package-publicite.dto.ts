import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { CibleAudiencePublicite } from 'generated/prisma';

export class UpdatePackagePubliciteDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  dureeJours?: number;

  @ApiPropertyOptional({ example: 30000 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  montant?: number;

  @ApiPropertyOptional({ enum: CibleAudiencePublicite })
  @IsOptional()
  @IsEnum(CibleAudiencePublicite)
  cibleAudience?: CibleAudiencePublicite;

  @ApiPropertyOptional({ example: 4 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  nombreMaxImages?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  nombreMaxVideos?: number;

  @ApiPropertyOptional({ example: 30 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(30)
  dureeMaxVideoSecondes?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  actif?: boolean;
}