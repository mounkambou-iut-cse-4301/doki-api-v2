// src/fiches/dto/create-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsArray, ValidateNested, IsString, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

class AnswerInput {
  @ApiProperty({ description: 'ID de la question' })
  @IsString()
  questionId: string;

  @ApiProperty({ 
    description: 'Réponse(s) - string pour TEXT, array de strings pour SELECT (multi-choix possible)',
    oneOf: [
      { type: 'string', example: 'Depuis 3 jours' },
      { type: 'array', items: { type: 'string' }, example: ['1_jour', '2_jours'] }
    ]
  })
  @IsOptional()
  value: string | string[];
}

export class CreateFicheResponseDto {
  @ApiProperty({ description: 'ID du patient qui répond' })
  @IsInt()
  @Min(1)
  patientId: number;

  @ApiProperty({ type: [AnswerInput] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerInput)
  answers: AnswerInput[];
}