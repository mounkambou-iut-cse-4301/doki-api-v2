import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, ArrayMinSize, IsInt, Min, IsNotEmpty, IsOptional, IsString, Matches, MaxLength, IsNumber, IsPositive } from 'class-validator';


export class CreateSuiviDto {
@ApiProperty({ description: 'ID du patient' })
@Type(() => Number) @IsInt() @Min(1)
patientId: number;


@ApiProperty({ description: 'Nom du médicament' })
@IsNotEmpty() @IsString() @MaxLength(255)
nomMedicament: string;


@ApiPropertyOptional({ description: 'Dosage (ex: 500mg)' })
@IsOptional() @IsString() @MaxLength(100)
dosage?: string;


@ApiPropertyOptional({ description: 'Fréquence (ex: 3x/jour)' })
@IsOptional() @IsString() @MaxLength(100)
frequence?: string;


@ApiProperty({ description: 'Date de début (YYYY-MM-DD)', example: '2025-08-01' })
@Matches(/^\d{4}-\d{2}-\d{2}$/)
date: string;


@ApiProperty({ description: 'Heures de prise dans la journée', example: ['06:00','12:00','19:00'] })
@IsArray() @ArrayMinSize(1)
@Matches(/^\d{2}:\d{2}$/,{ each: true })
heures: string[];


@ApiProperty({ description: 'Nombre de jours (>=1)', example: 3 })
@Type(() => Number) @IsInt() @Min(1)
days: number;


@ApiPropertyOptional({ description: 'Stock initial (optionnel)', example: 20 })
@IsOptional() @Type(() => Number) @IsInt() @Min(0)
stock?: number;


@ApiPropertyOptional({ description: "ID de l'ordonnance liée (optionnel)" })
@IsOptional() @Type(() => Number) @IsInt() @Min(1)
ordonanceId?: number;
}