import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsInt, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class AnswerInput {
  @ApiProperty() @IsString() questionId: string;
  @ApiPropertyOptional() @IsOptional() @IsString() valueText?: string;   // TEXT
  @ApiPropertyOptional() @IsOptional() @IsString() optionValue?: string; // SELECT
}

export class SubmitFicheResponseDto {
  @ApiProperty() @IsInt() @Min(1) ficheId: number;
  @ApiProperty() @IsInt() @Min(1) conversationId: number;
  @ApiProperty({ description: 'Auteur' }) @IsInt() @Min(1) senderId: number;
  @ApiPropertyOptional({ description: 'Ex: patient concerné' }) @IsOptional() @IsInt() @Min(1) submittedForUserId?: number;

  @ApiProperty({ type: [AnswerInput] })
  @IsArray() @ValidateNested({ each: true }) @Type(() => AnswerInput)
  answers: AnswerInput[];

  @ApiPropertyOptional({ description: 'Message de DEMANDE auquel on répond' })
  @IsOptional() @IsInt() @Min(1)
  requestMessageId?: number;
}
