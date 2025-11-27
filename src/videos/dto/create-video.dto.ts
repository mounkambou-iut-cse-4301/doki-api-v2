import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, Min, IsNotEmpty, IsString, MaxLength, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateVideoDto {
  @ApiProperty({ description: 'Titre de la vidéo' })
  @IsNotEmpty() @IsString() @MaxLength(255)
  title: string;

  @ApiProperty({ description: 'Chemin/URL OU Data URL base64 de la vidéo' })
  @IsNotEmpty() @IsString() @MaxLength(2000)
  path: string;

  @ApiPropertyOptional({ description: 'Description' })
  @IsOptional() @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Duree de la video' })
@IsOptional() @IsString()
  duree?: string;

  @ApiPropertyOptional({ description: 'ID de la catégorie (CategoryVideo.categoryId)' })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  categoryVideoId?: number;

  @ApiProperty({ description: 'ID du médecin propriétaire' })
  @Type(() => Number) @IsInt() @Min(1)
  medecinId: number;
}
