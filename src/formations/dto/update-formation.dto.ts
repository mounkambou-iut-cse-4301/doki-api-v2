import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateFormationDto } from './create-formation.dto';
import { IsArray, IsInt, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { UpdateLessonDto } from './update-lesson.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';

class UpdateFormationBase extends PartialType(CreateFormationDto) {}
class UpdateFormationWithoutLessons extends OmitType(UpdateFormationBase, ['lessons'] as const) {}

export class UpdateFormationDto extends UpdateFormationWithoutLessons {
  @ApiPropertyOptional({
    type: () => [UpdateLessonDto],
    description:
      "Liste de leçons à upserter. Si `lessonId` est fourni ⇒ update. Sans `lessonId` ⇒ create. " +
      "Chaque `fileUrl` peut être une URL http(s) ou un base64 data URL (image/vidéo/pdf).",
    examples: {
      createNewLessons: {
        summary: 'Créer 2 nouvelles leçons',
        value: [
          {
            title: 'Nouveaux cas complexes',
            description: 'Cas cliniques rares',
            orderIndex: 3,
            fileUrl: 'data:video/mp4;base64,AAA...' // exemple base64
          },
          {
            title: 'Lecture ECG pédiatrique',
            orderIndex: 4,
            fileUrl: 'https://cdn.example.com/lecgpedia.mp4'
          }
        ]
      },
      updateExistingLessons: {
        summary: 'Mettre à jour 2 leçons existantes',
        value: [
          { lessonId: 10, title: 'Intro ECG (maj)', orderIndex: 1 },
          { lessonId: 11, description: 'Ajout de notes', fileUrl: 'data:application/pdf;base64,JVBERi0xLjQK...' }
        ]
      },
      mixedCreateUpdate: {
        summary: 'Mix : update + create',
        value: [
          { lessonId: 12, title: 'Bases (v2)', orderIndex: 1 },
          { title: 'Nouveau chapitre', description: 'Chapitre inédit', orderIndex: 5 }
        ]
      }
    }
  })
  @IsOptional()
  @IsArray()
  @Type(() => UpdateLessonDto)
  lessons?: UpdateLessonDto[];

  @ApiPropertyOptional({
    type: () => [Number],
    description: 'IDs des leçons à supprimer',
    example: [11, 12]
  })
  @IsOptional()
  @IsArray()
  @Type(() => Number)
  @IsInt({ each: true })
  @Min(1, { each: true })
  removeLessonIds?: number[];
}
