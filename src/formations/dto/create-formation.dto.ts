import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateLessonDto } from './create-lesson.dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFormationDto {
  @ApiProperty({ maxLength: 255, example: 'ECG avancé' })
  @IsString()
  @MaxLength(255)
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ minimum: 1, example: 1, description: 'FK Category' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
    @IsOptional()

  categoryId!: number;

  @ApiProperty({ example: 'Interprétation ECG' })
  @IsString()
  @IsNotEmpty()
  competence!: string;

  @ApiProperty({ minimum: 1, example: 12 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  dureeHeures!: number;

  @ApiPropertyOptional({ example: 'Session pratique' })
  @IsOptional()
  @IsString()
  comment?: string;

  @ApiPropertyOptional({ type: () => [CreateLessonDto] })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateLessonDto)
  lessons?: CreateLessonDto[];
}
