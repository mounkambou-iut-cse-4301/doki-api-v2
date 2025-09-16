import { PartialType } from '@nestjs/mapped-types';
import { CreateLessonDto } from './create-lesson.dto';
import { IsInt, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateLessonDto extends PartialType(CreateLessonDto) {
  @ApiPropertyOptional({
    description:
      'Identifiant de la leçon à mettre à jour (si présent => update, si absent => create)',
    example: 42,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  lessonId?: number;

  // Hérités de CreateLessonDto :
  // - title?: string
  // - description?: string
  // - fileUrl?: string
  // - orderIndex?: number
  // - categoryId?: number
}
