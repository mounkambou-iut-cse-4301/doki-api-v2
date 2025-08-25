import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Min, IsOptional, IsString, Matches, MaxLength } from 'class-validator';


export class UpdateSuiviDto {
@ApiPropertyOptional({ description: 'Nom du médicament' })
@IsOptional() @IsString() @MaxLength(255)
nomMedicament?: string;


@ApiPropertyOptional({ description: 'Dosage' })
@IsOptional() @IsString() @MaxLength(100)
dosage?: string;


@ApiPropertyOptional({ description: 'Fréquence' })
@IsOptional() @IsString() @MaxLength(100)
frequence?: string;


@ApiPropertyOptional({ description: 'Heure (HH:mm)' })
@IsOptional() @Matches(/^\d{2}:\d{2}$/)
heure?: string;


@ApiPropertyOptional({ description: 'Date (YYYY-MM-DD)' })
@IsOptional() @Matches(/^\d{4}-\d{2}-\d{2}$/)
date?: string;


@ApiPropertyOptional({ description: 'Stock' })
@IsOptional() @Type(() => Number) @IsInt() @Min(0)
stock?: number;


@ApiPropertyOptional({ description: "ID d'ordonnance" })
@IsOptional() @Type(() => Number) @IsInt() @Min(1)
ordonanceId?: number;
}