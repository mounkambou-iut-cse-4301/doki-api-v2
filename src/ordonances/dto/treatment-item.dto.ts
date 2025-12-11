import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsArray, ArrayMinSize, IsDateString, IsBoolean, IsOptional, ValidateNested, IsEnum, IsNumber, Min, Matches } from 'class-validator';
import { Type } from 'class-transformer';

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

  // @ApiPropertyOptional({ 
  //   description: 'Pour weekly: jours de la semaine [1-7] où 1=lundi, 7=dimanche',
  //   example: [1, 3, 5],
  //   type: [Number]
  // })
  // @IsOptional() @IsArray() 
  // @IsNumber({}, { each: true }) 
  // daysOfWeek?: number[];
}

export class TreatmentItemDto {
  @ApiProperty({ 
    example: 'paracetamol-001',
    description: 'ID unique du traitement'
  })
  @IsString() @IsNotEmpty()
  id: string;

  @ApiProperty({ 
    example: 'Paracétamol',
    description: 'Nom du médicament'
  })
  @IsString() @IsNotEmpty()
  name: string;

  @ApiProperty({ 
    example: '500mg',
    description: 'Dosage du médicament'
  })
  @IsString() @IsNotEmpty()
  dosage: string;

  @ApiProperty({ 
    example: 'comprimé',
    description: 'Forme galénique',
    enum: ['comprimé', 'gélule', 'sirop', 'crème', 'injection']
  })
  @IsString() @IsNotEmpty()
  forme: string;

  @ApiProperty({ 
    example: 'orale',
    description: 'Voie d\'administration',
    enum: ['orale', 'cutanée', 'intraveineuse', 'intramusculaire', 'sous-cutanée']
  })
  @IsString() @IsNotEmpty()
  voie: string;

  @ApiProperty({ 
    example: '1 comprimé 3 fois par jour',
    description: 'Posologie détaillée'
  })
  @IsString() @IsNotEmpty()
  posologie: string;

  @ApiProperty({ 
    example: 'Prendre après les repas',
    description: 'Instructions spécifiques'
  })
  @IsString() @IsNotEmpty()
  instructions: string;

  @ApiProperty({ 
    example: '2025-08-02',
    description: 'Date de début du traitement'
  })
  @IsDateString()
  startDate: string;

  @ApiProperty({ 
    example: '2025-08-16',
    description: 'Date de fin du traitement'
  })
  @IsDateString()
  endDate: string;

  @ApiProperty({ 
    type: FrequencyDto,
    example: {
      type: 'daily',
      timesPerDay: 3
    },
    description: 'Fréquence de prise'
  })
  @ValidateNested()
  @Type(() => FrequencyDto)
  frequency: FrequencyDto;

  @ApiProperty({ 
    example: ['08:00', '13:00', '20:00'],
    type: [String],
    description: 'Heures de rappel'
  })
  @IsArray() @ArrayMinSize(1)
  @Matches(/^\d{2}:\d{2}$/, { each: true })
  notificationTimes: string[];

  @ApiProperty({ 
    example: true,
    description: 'Statut actif du traitement'
  })
  @IsBoolean()
  isActive: boolean;
}