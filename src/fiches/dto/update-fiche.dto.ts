// src/fiches/dto/update-fiche.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsEnum, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { QType } from './create-fiche.dto';

class OptionUpsert {
  @ApiPropertyOptional() @IsOptional() @IsString() label?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() value?: string;
}

class QuestionUpsert {
  @ApiPropertyOptional({ description: 'Si présent => conserve cet id' })
  @IsOptional() @IsString() id?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() label?: string;
  @ApiPropertyOptional({ enum: QType }) @IsOptional() @IsEnum(QType) type?: QType;
  @ApiPropertyOptional() @IsOptional() order?: number;
  
  // 👈 NOUVEAU : champ multiple pour les SELECT
  @ApiPropertyOptional({ 
    description: 'Autoriser plusieurs réponses (pour SELECT uniquement)',
    default: false 
  })
  @IsOptional()
  @IsBoolean()
  multiple?: boolean;

  // si fourni => remplacement intégral des options pour cette question
  @ApiPropertyOptional({ type: [OptionUpsert] })
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => OptionUpsert)
  options?: OptionUpsert[];
}

export class UpdateFicheDto {
  @ApiPropertyOptional() @IsOptional() @IsString() title?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;

  @ApiPropertyOptional({ type: [QuestionUpsert] })
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => QuestionUpsert)
  questions?: QuestionUpsert[];
}