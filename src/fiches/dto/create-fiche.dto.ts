// src/fiches/dto/create-fiche.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsBoolean, IsEnum, IsInt, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export enum QType { TEXT='TEXT', SELECT='SELECT' }

class OptionInput {
  @ApiProperty() @IsString() label: string;
  @ApiProperty() @IsString() value: string;
}

class QuestionInput {
  @ApiProperty() @IsString() label: string;
  @ApiProperty({ enum: QType }) @IsEnum(QType) type: QType;
  @ApiProperty({ default: 0 }) @IsOptional() order?: number;
  
  // 👇 NOUVEAU : Permet de spécifier si plusieurs réponses sont autorisées (pour SELECT)
  @ApiProperty({ 
    description: 'Autoriser plusieurs réponses (pour SELECT uniquement)',
    default: false,
    required: false 
  })
  @IsOptional()
  @IsBoolean()
  multiple?: boolean;
  
  @ApiProperty({ type: [OptionInput], required: false })
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => OptionInput)
  options?: OptionInput[];
}

export class CreateFicheDto {
  @ApiProperty() @IsString() title: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() description?: string;
  @ApiProperty() @IsInt() @Min(1) createdBy: number;

  @ApiProperty({ type: [QuestionInput] })
  @IsArray() @ArrayMinSize(1) @ValidateNested({ each: true }) @Type(() => QuestionInput)
  questions: QuestionInput[];
}