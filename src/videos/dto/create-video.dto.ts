// src/videos/dto/create-video.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, Min, IsNotEmpty, IsString, MaxLength, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateVideoDto {
  @ApiProperty({ description: 'Titre de la vidéo' })
  @IsNotEmpty() @IsString() @MaxLength(255)
  title: string;

  @ApiProperty({ description: 'Chemin/URL du média' })
  @IsNotEmpty() @IsString() @MaxLength(255)
  path: string;

  @ApiPropertyOptional({ description: 'Description' })
  @IsOptional() @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'ID de la catégorie (table Category)' })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  categoryId?: number;

  @ApiProperty({ description: 'ID du médecin propriétaire' })
  @Type(() => Number) @IsInt() @Min(1)
  medecinId: number;
}
