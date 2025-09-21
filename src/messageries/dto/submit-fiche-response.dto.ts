import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsInt, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class FicheAnswerInput {
  @ApiProperty() @IsInt() @Min(1)
  questionId: number;

  @ApiProperty() @IsString()
  valueText: string;
}

export class SubmitFicheResponseDto {
  @ApiProperty() @IsInt() @Min(1)
  ficheId: number;

  @ApiProperty() @IsInt() @Min(1)
  conversationId: number;

  @ApiProperty({ description: 'Auteur de la réponse' }) @IsInt() @Min(1)
  senderId: number;

  @ApiPropertyOptional({ description: 'Ex: patient concerné' })
  @IsOptional() @IsInt() @Min(1)
  submittedForUserId?: number;

  @ApiProperty({ type: [FicheAnswerInput] })
  @IsArray() @ValidateNested({ each: true }) @Type(() => FicheAnswerInput)
  answers: FicheAnswerInput[];

  @ApiPropertyOptional({ description: 'ID du message de demande auquel on répond' })
  @IsOptional() @IsInt() @Min(1)
  requestMessageId?: number;
}
