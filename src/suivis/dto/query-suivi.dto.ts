import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, Matches, Min, IsDateString } from 'class-validator';

export class QuerySuiviDto {
  @ApiPropertyOptional({ description: 'Filtrer par patient' })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  patientId?: number;

  @ApiPropertyOptional({ description: 'Filtrer par ordonnance' })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  ordonanceId?: number;

  @ApiPropertyOptional({ description: 'Filtrer par date de début' })
  @IsOptional() @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Filtrer par date de fin' })
  @IsOptional() @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Recherche dans nom, dosage, posologie' })
  @IsOptional() @IsString()
  q?: string;

  @ApiPropertyOptional({ description: 'Filtrer par statut actif' })
  @IsOptional() @Type(() => Boolean) @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  limit?: number = 10;
}