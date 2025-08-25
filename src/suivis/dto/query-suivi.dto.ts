import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, Matches, Min } from 'class-validator';


export class QuerySuiviDto {
@ApiPropertyOptional({ description: 'Filtrer par patient' })
@IsOptional() @Type(() => Number) @IsInt() @Min(1)
patientId?: number;


@ApiPropertyOptional({ description: 'Filtrer par date (YYYY-MM-DD)' })
@IsOptional() @Matches(/^\d{4}-\d{2}-\d{2}$/)
date?: string;


@ApiPropertyOptional({ description: 'Nom médicament (contains, insensitive)' })
@IsOptional() @IsString()
q?: string;


@ApiPropertyOptional({ description: 'Filtrer par statut de prise' })
@IsOptional() @Type(() => Boolean) @IsBoolean()
isTaken?: boolean;


@ApiPropertyOptional({ default: 1 })
@IsOptional() @Type(() => Number) @IsInt() @Min(1)
page?: number = 1;


@ApiPropertyOptional({ default: 10 })
@IsOptional() @Type(() => Number) @IsInt() @Min(1)
limit?: number = 10;
}