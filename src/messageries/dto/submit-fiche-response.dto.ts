// import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
// import { IsArray, IsInt, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
// import { Type } from 'class-transformer';

// class AnswerInput {
//   @ApiProperty() @IsString() questionId: string;
//   @ApiPropertyOptional() @IsOptional() @IsString() valueText?: string;   // TEXT
//   @ApiPropertyOptional() @IsOptional() @IsString() optionValue?: string; // SELECT
// }

// export class SubmitFicheResponseDto {
//   @ApiProperty() @IsInt() @Min(1) ficheId: number;
//   @ApiProperty() @IsInt() @Min(1) conversationId: number;
//   @ApiProperty({ description: 'Auteur' }) @IsInt() @Min(1) senderId: number;
//   @ApiPropertyOptional({ description: 'Ex: patient concerné' }) @IsOptional() @IsInt() @Min(1) submittedForUserId?: number;

//   @ApiProperty({ type: [AnswerInput] })
//   @IsArray() @ValidateNested({ each: true }) @Type(() => AnswerInput)
//   answers: AnswerInput[];

//   @ApiPropertyOptional({ description: 'Message de DEMANDE auquel on répond' })
//   @IsOptional() @IsInt() @Min(1)
//   requestMessageId?: number;
// }
// src/messageries/dto/submit-fiche-response.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsInt, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class AnswerInput {
  @ApiProperty({ description: 'ID de la question' })
  @IsString()
  questionId: string;

  @ApiPropertyOptional({ description: 'Réponse textuelle (pour TEXT)' })
  @IsOptional()
  @IsString()
  valueText?: string;

  @ApiPropertyOptional({ 
    description: 'Valeur(s) sélectionnée(s) (pour SELECT) - string ou array de strings',
    oneOf: [
      { type: 'string', example: '1_jour' },
      { type: 'array', items: { type: 'string' }, example: ['1_jour', '2_jours'] }
    ]
  })
  @IsOptional()
  optionValue?: string | string[];
}

export class SubmitFicheResponseDto {
  @ApiProperty({ description: 'ID de la fiche' })
  @IsInt() @Min(1)
  ficheId: number;

  @ApiProperty({ description: 'ID de la conversation' })
  @IsInt() @Min(1)
  conversationId: number;

  @ApiProperty({ description: 'Auteur de la réponse' })
  @IsInt() @Min(1)
  senderId: number;

  @ApiPropertyOptional({ description: 'Patient concerné (si différent de l\'auteur)' })
  @IsOptional() @IsInt() @Min(1)
  submittedForUserId?: number;

  @ApiProperty({ 
    type: [AnswerInput],
    description: 'Réponses aux questions',
    example: [
      {
        questionId: "550e8400-e29b-41d4-a716-446655440000",
        optionValue: ["1_jour", "2_jours"]  // ✅ Réponses MULTIPLES
      },
      {
        questionId: "550e8400-e29b-41d4-a716-446655440001",
        valueText: "Fièvre depuis hier soir"
      }
    ]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerInput)
  answers: AnswerInput[];

  @ApiPropertyOptional({ description: 'Message de demande auquel on répond' })
  @IsOptional() @IsInt() @Min(1)
  requestMessageId?: number;
}