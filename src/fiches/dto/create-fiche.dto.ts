import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsInt, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class FicheQuestionInput {
  @ApiProperty() @IsString()
  label: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  orderIndex?: number;
}

export class CreateFicheDto {
  @ApiProperty() @IsString()
  title: string;

  @ApiPropertyOptional() @IsOptional() @IsString()
  description?: string;

  @ApiProperty({ description: 'Créateur (médecin)' })
  @IsInt() @Min(1)
  createdBy: number;

  @ApiProperty({ type: [FicheQuestionInput] })
  @IsArray() @ArrayMinSize(1) @ValidateNested({ each: true }) @Type(() => FicheQuestionInput)
  questions: FicheQuestionInput[];
}
