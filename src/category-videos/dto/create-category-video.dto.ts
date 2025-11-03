import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCategoryVideoDto {
  @ApiProperty({ description: 'Nom unique de la catégorie' })
  @IsNotEmpty() @IsString() @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ description: 'Description optionnelle' })
  @IsOptional() @IsString()
  description?: string;
}
