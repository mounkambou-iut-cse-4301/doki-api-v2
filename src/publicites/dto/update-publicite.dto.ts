import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { MediaPubliciteInputDto } from './media-publicite-input.dto';

export class UpdatePubliciteDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  titre?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: '2026-04-15T08:00:00.000Z',
    description: 'Nouvelle date de début',
  })
  @IsOptional()
  @IsDateString()
  dateDebut?: string;

  @ApiPropertyOptional({ example: 8 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  annonceurUtilisateurId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nomAnnonceurExterne?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  telephoneAnnonceurExterne?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  emailAnnonceurExterne?: string;

  @ApiPropertyOptional({
    type: [MediaPubliciteInputDto],
    description: 'Si fourni, remplace entièrement les médias existants',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MediaPubliciteInputDto)
  medias?: MediaPubliciteInputDto[];
}