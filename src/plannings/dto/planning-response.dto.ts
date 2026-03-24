// src/planning/dto/planning-response.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PlanningType } from 'generated/prisma';

export class SlotResponseDto {
  @ApiProperty({ description: 'Heure de début', example: '08:00:00' })
  start: string;

  @ApiProperty({ description: 'Heure de fin', example: '08:30:00' })
  end: string;

  @ApiProperty({ enum: PlanningType, description: 'Type de créneau' })
  type: PlanningType;

  @ApiPropertyOptional({ description: 'ID de l\'hôpital', example: 1 })
  hopitalId?: number;

  @ApiPropertyOptional({ description: 'Nom de l\'hôpital', example: 'Hôpital Central' })
  hopitalName?: string;

  @ApiPropertyOptional({ description: 'Adresse de l\'hôpital', example: 'Boulevard du 20 Mai' })
  hopitalAddress?: string;

  @ApiPropertyOptional({ description: 'Salle de consultation', example: 'Consultation A' })
  salle?: string;

  @ApiProperty({ description: 'Prix de consultation', example: 15000 })
  price: number;

  @ApiProperty({ description: 'Durée de consultation en minutes', example: 30 })
  duration: number;
}

export class PlanningSlotDetailDto {
  @ApiProperty({ description: 'ID du planning', example: 10 })
  planningId: number;

  @ApiProperty({ description: 'Heure de début', example: '08:00:00' })
  debutHour: string;

  @ApiProperty({ description: 'Heure de fin', example: '12:00:00' })
  endHour: string;

  @ApiProperty({ enum: PlanningType, description: 'Type de planning' })
  type: PlanningType;

  @ApiPropertyOptional({ description: 'ID de l\'hôpital', example: 1 })
  hopitalId?: number;

  @ApiPropertyOptional({ description: 'Nom de l\'hôpital', example: 'Hôpital Central' })
  hopitalName?: string;

  @ApiPropertyOptional({ description: 'Adresse de l\'hôpital', example: 'Boulevard du 20 Mai' })
  hopitalAddress?: string;

  @ApiPropertyOptional({ description: 'Salle de consultation', example: 'Consultation A' })
  salle?: string;

  @ApiPropertyOptional({ description: 'Prix de consultation (uniquement pour présentiel)', example: 15000 })
  consultationPrice?: number;

  @ApiPropertyOptional({ description: 'Durée de consultation (uniquement pour présentiel)', example: 30 })
  consultationDuration?: number;
}