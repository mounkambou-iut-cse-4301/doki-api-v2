// src/messageries/dto/explain-question.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';

export enum AiProvider {
  OPENAI = 'openai',
  GEMINI = 'gemini',
}

export class ExplainQuestionDto {

    @ApiProperty   ({ description: 'ID de la fiche', example: 123 })
  @IsInt()
  ficheId: number;
@ApiProperty({ description: 'ID de la question', example: "fdaea1ad-448a-424f-815b-21c73571b936" })
  @IsString()
  questionId: string;

    @ApiPropertyOptional({ description: 'Fournisseur AI (openai ou gemini)', required: false, enum: AiProvider, example: AiProvider.OPENAI })
  @IsOptional()
  @IsEnum(AiProvider)
  provider?: AiProvider; // default openai
}
