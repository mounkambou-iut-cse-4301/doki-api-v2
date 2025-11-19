import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCategoryVideoDto {
  @ApiProperty({ description: 'Nom unique de la catégorie' })
  @IsNotEmpty() @IsString() @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ description: 'Description optionnelle' })
  @IsOptional() @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Cover image (URL or base64). Will be uploaded to Cloudinary.' })
  @IsOptional() @IsString()
  coverImage?: string;
}
