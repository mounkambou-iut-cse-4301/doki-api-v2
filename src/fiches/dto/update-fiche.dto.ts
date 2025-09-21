import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsInt, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class FicheQuestionUpsert {
  @ApiPropertyOptional({ description: 'Présent si update' })
  @IsOptional() @IsInt() @Min(1)
  ficheQuestionId?: number;

  @ApiPropertyOptional() @IsOptional() @IsString()
  label?: string;

  @ApiPropertyOptional() @IsOptional()
  orderIndex?: number;
}

export class UpdateFicheDto {
  @ApiPropertyOptional() @IsOptional() @IsString()
  title?: string;

  @ApiPropertyOptional() @IsOptional() @IsString()
  description?: string;

  @ApiPropertyOptional() @IsOptional() @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ type: [FicheQuestionUpsert], description: 'Liste finale des questions (upsert + suppressions implicites)' })
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => FicheQuestionUpsert)
  questions?: FicheQuestionUpsert[];
}
