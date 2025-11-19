import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, ArrayMinSize, IsInt, Min, IsNotEmpty, IsOptional, IsString, Matches, MaxLength, IsDateString, IsBoolean, ValidateNested, IsEnum, IsNumber } from 'class-validator';

export class FrequencyDto {
  @ApiProperty({ 
    enum: ['daily', 'weekly'],
    example: 'daily',
    description: 'Type de fréquence'
  })
  @IsEnum(['daily', 'weekly'])
  type: string;

  @ApiPropertyOptional({ 
    description: 'Pour daily: nombre de fois par jour',
    example: 3,
    minimum: 1
  })
  @IsOptional() @IsNumber() @Min(1)
  timesPerDay?: number;

  @ApiPropertyOptional({ 
    description: 'Pour weekly: jours de la semaine [1-7] où 1=lundi, 7=dimanche',
    example: [1, 3, 5],
    type: [Number]
  })
  @IsOptional() @IsArray() 
  @IsNumber({}, { each: true }) 
  daysOfWeek?: number[];
}

export class CreateSuiviDto {
  @ApiProperty({ 
    description: 'ID du patient',
    example: 14
  })
  @Type(() => Number) @IsInt() @Min(1) // RETIRÉ @IsOptional()
  patientId: number;

  @ApiProperty({ 
    description: 'Nom du médicament',
    example: 'Paracétamol'
  })
  @IsNotEmpty() @IsString() @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ 
    description: 'Dosage (ex: 500mg)',
    example: '500mg'
  })
  @IsOptional() @IsString() @MaxLength(100)
  dosage?: string;

  @ApiPropertyOptional({ 
    description: 'Posologie',
    example: '1 comprimé 3 fois par jour'
  })
  @IsOptional() @IsString() @MaxLength(255)
  posologie?: string;

  @ApiPropertyOptional({ 
    description: 'Forme galénique',
    example: 'comprimé',
    enum: ['comprimé', 'gélule', 'sirop', 'crème', 'injection']
  })
  @IsOptional() @IsString() @MaxLength(100)
  forme?: string;

  @ApiPropertyOptional({ 
    description: 'Voie d\'administration',
    example: 'orale',
    enum: ['orale', 'cutanée', 'intraveineuse', 'intramusculaire', 'sous-cutanée']
  })
  @IsOptional() @IsString() @MaxLength(100)
  voie?: string;

  @ApiPropertyOptional({ 
    description: 'Instructions',
    example: 'Prendre après les repas'
  })
  @IsOptional() @IsString() @MaxLength(500)
  instructions?: string;

  @ApiProperty({ 
    description: 'Date de début',
    example: '2025-08-02'
  })
  @IsDateString()
  startDate: string;

  @ApiProperty({ 
    description: 'Date de fin',
    example: '2025-08-16'
  })
  @IsDateString()
  endDate: string;

  @ApiProperty({ 
    description: 'Fréquence',
    type: FrequencyDto,
    example: {
      type: 'daily',
      timesPerDay: 3
    }
  })
  @ValidateNested()
  @Type(() => FrequencyDto)
  frequency: FrequencyDto;

  @ApiProperty({ 
    description: 'Heures de notification',
    example: ['08:00', '13:00', '20:00'],
    type: [String]
  })
  @IsArray() 
  @ArrayMinSize(1)
  @Matches(/^\d{2}:\d{2}$/, { each: true })
  notificationTimes: string[];

  @ApiProperty({ 
    description: 'Statut actif',
    example: true
  })
  @IsBoolean()
  isActive: boolean;

  @ApiPropertyOptional({ 
    description: "ID de l'ordonnance liée",
    example: 1
  })
  @IsOptional() @Type(() => Number) @IsInt()
  ordonanceId?: number;
}