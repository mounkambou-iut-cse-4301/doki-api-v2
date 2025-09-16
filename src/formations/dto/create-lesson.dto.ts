import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLessonDto {
  @ApiProperty({ maxLength: 255, example: 'Introduction à l’ECG' })
  @IsString()
  @MaxLength(255)
  title!: string;

  @ApiPropertyOptional({ example: 'Bases théoriques' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/intro.mp4' })
  @IsOptional()
  @IsString()
  // Remarque : on accepte soit une URL http(s), soit un data URI (base64) ; la validation fine est gérée en amont/aval.
  fileUrl?: string;

  @ApiPropertyOptional({ minimum: 0, example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  orderIndex?: number;

  @ApiPropertyOptional({
    description: 'Catégorie (facultative) de la leçon',
    example: 3,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  categoryId?: number;
}
