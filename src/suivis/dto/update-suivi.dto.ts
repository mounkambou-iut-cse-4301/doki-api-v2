import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Min, IsOptional, IsString, Matches, MaxLength, IsDateString, IsBoolean } from 'class-validator';

export class UpdateSuiviDto {
  @ApiPropertyOptional({ description: 'Nom du médicament' })
  @IsOptional() @IsString() @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ description: 'Dosage' })
  @IsOptional() @IsString() @MaxLength(100)
  dosage?: string;

  @ApiPropertyOptional({ description: 'Posologie' })
  @IsOptional() @IsString() @MaxLength(255)
  posologie?: string;

  @ApiPropertyOptional({ description: 'Forme galénique' })
  @IsOptional() @IsString() @MaxLength(100)
  forme?: string;

  @ApiPropertyOptional({ description: 'Voie d\'administration' })
  @IsOptional() @IsString() @MaxLength(100)
  voie?: string;

  @ApiPropertyOptional({ description: 'Instructions' })
  @IsOptional() @IsString() @MaxLength(500)
  instructions?: string;

  @ApiPropertyOptional({ description: 'Date de début' })
  @IsOptional() @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Date de fin' })
  @IsOptional() @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Fréquence (JSON)' })
  @IsOptional()
  frequency?: any;

  @ApiPropertyOptional({ description: 'Heures de notification (JSON)' })
  @IsOptional()
  notificationTimes?: any;

  @ApiPropertyOptional({ description: 'Statut actif' })
  @IsOptional() @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: "ID d'ordonnance" })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  ordonanceId?: number;
}