import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsDateString,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { MediaPubliciteInputDto } from './media-publicite-input.dto';

export class CreatePubliciteDto {
  @ApiProperty({
    example: 7,
    description: 'Utilisateur plateforme qui téléverse la campagne',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  televerseParId: number;

  @ApiPropertyOptional({
    example: 7,
    description: 'Annonceur présent dans la plateforme',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  annonceurUtilisateurId?: number;

  @ApiPropertyOptional({
    example: 'Clinique Lumière',
    description: 'Nom si annonceur externe',
  })
  @IsOptional()
  @IsString()
  nomAnnonceurExterne?: string;

  @ApiPropertyOptional({ example: '+237699000111' })
  @IsOptional()
  @IsString()
  telephoneAnnonceurExterne?: string;

  @ApiPropertyOptional({ example: 'contact@clinique.cm' })
  @IsOptional()
  @IsEmail()
  emailAnnonceurExterne?: string;

  @ApiProperty({
    example: 1,
    description: 'Package choisi',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  packagePubliciteId: number;

  @ApiProperty({ example: 'Campagne Avril Santé' })
  @IsNotEmpty()
  @IsString()
  titre: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    example: '2026-04-10T08:00:00.000Z',
    description: 'Date à laquelle la publicité doit commencer',
  })
  @IsDateString()
  dateDebut: string;

  @ApiProperty({
    type: [MediaPubliciteInputDto],
    description: 'Images et/ou vidéos de la campagne',
  })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => MediaPubliciteInputDto)
  medias: MediaPubliciteInputDto[];
}