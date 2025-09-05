import { IsInt, IsOptional, IsString, IsUrl, MaxLength, Min } from 'class-validator';
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
  fileUrl?: string;

  @ApiPropertyOptional({ minimum: 0, example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  orderIndex?: number;
}
