import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class QueryMedicamentDto {
  @ApiPropertyOptional({
    description: 'Recherche globale (nom, dosage, forme, voie, posologie)',
  })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ description: 'Filtrer par nom (contains)' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Filtrer par dosage (contains)' })
  @IsOptional()
  @IsString()
  dosage?: string;

  @ApiPropertyOptional({ description: 'Filtrer par forme (contains)' })
  @IsOptional()
  @IsString()
  forme?: string;

  @ApiPropertyOptional({ description: 'Filtrer par voie (contains)' })
  @IsOptional()
  @IsString()
  voie?: string;

  @ApiPropertyOptional({ description: 'Filtrer par posologie (contains)' })
  @IsOptional()
  @IsString()
  posologie?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;
}
