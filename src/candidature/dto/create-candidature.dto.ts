import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsString,
  Min,
} from 'class-validator';

export class CreateCandidatureDto {
  @ApiProperty({
    example: 7,
    description: 'ID du médecin qui envoie la candidature',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  medecinId: number;

  @ApiProperty({
    example:
      "Monsieur le Directeur, je vous adresse ma candidature en qualité de cardiologue afin d’intégrer votre établissement.",
    description: 'Lettre de motivation / description de la candidature',
  })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({
    example: 'data:application/pdf;base64,JVBERi0xLjQKJ...',
    description:
      'CV/photo/fichier en base64 ou URL déjà existante',
  })
  @IsNotEmpty()
  @IsString()
  file: string;

  @ApiProperty({
    example: [15, 16],
    description:
      'Liste des IDs des hôpitaux auxquels le médecin veut envoyer la candidature',
    type: [Number],
  })
  @IsArray()
  @ArrayNotEmpty()
  @Type(() => Number)
  @IsInt({ each: true })
  @Min(1, { each: true })
  hopitalIds: number[];
}