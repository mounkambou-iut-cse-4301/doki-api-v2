// src/planning/dto/create-planning.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { 
  IsNotEmpty, 
  IsString, 
  IsInt, 
  IsOptional, 
  IsEnum, 
  IsIn, 
  IsBoolean, 
  ValidateIf,
  IsArray,
  ValidateNested,
  IsNumber,
  Min
} from 'class-validator';
import { PlanningType } from 'generated/prisma';

export class PlanningSlotDto {
  @ApiProperty({ description: 'Heure de début (HH:MM:SS)', example: '08:00:00' })
  @IsNotEmpty()
  @IsString()
  debutHour: string;

  @ApiProperty({ description: 'Heure de fin (HH:MM:SS)', example: '12:00:00' })
  @IsNotEmpty()
  @IsString()
  endHour: string;

  @ApiProperty({ enum: PlanningType, description: 'Type de planning' })
  @IsNotEmpty()
  @IsEnum(PlanningType)
  type: PlanningType;

  @ApiPropertyOptional({ description: 'ID de l\'hôpital (obligatoire si type = IN_PERSON)' })
  @ValidateIf(o => o.type === 'IN_PERSON')
  @IsNotEmpty()
  @IsInt()
  hopitalId?: number;

  @ApiPropertyOptional({ description: 'Salle de consultation' })
  @IsOptional()
  @IsString()
  salle?: string;

  // Ces champs sont obligatoires UNIQUEMENT pour les créneaux en présentiel
  @ApiPropertyOptional({ description: 'Prix de consultation (obligatoire pour les créneaux en présentiel)', example: 15000 })
  @ValidateIf(o => o.type === 'IN_PERSON')
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  consultationPrice?: number;

  @ApiPropertyOptional({ description: 'Durée de consultation en minutes (obligatoire pour les créneaux en présentiel)', example: 30 })
  @ValidateIf(o => o.type === 'IN_PERSON')
  @IsNotEmpty()
  @IsNumber()
  @Min(15)
  consultationDuration?: number;
}

export class JourPlanningDto {
  @ApiProperty({ description: 'Jour de la semaine', enum: ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'] })
  @IsNotEmpty()
  @IsString()
  @IsIn(['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'])
  jour: string;

  @ApiProperty({ description: 'Ce jour est-il off (fermé) ?', default: false })
  @IsNotEmpty()
  @IsBoolean()
  isOff: boolean;

  @ApiPropertyOptional({ description: 'Liste des créneaux pour ce jour (ignoré si isOff = true)', type: [PlanningSlotDto] })
  @ValidateIf(o => !o.isOff)
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlanningSlotDto)
  slots?: PlanningSlotDto[];
}

export class CreatePlanningDto {
  @ApiProperty({ description: 'ID du médecin' })
  @IsNotEmpty()
  @IsInt()
  medecinId: number;

  @ApiProperty({ description: 'Plannings par jour', type: [JourPlanningDto] })
  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => JourPlanningDto)
  plannings: JourPlanningDto[];
}