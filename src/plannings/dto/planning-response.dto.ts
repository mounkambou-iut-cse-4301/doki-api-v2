// src/planning/dto/planning-response.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PlanningType } from 'generated/prisma';

// ==================== SLOT RESPONSE ====================
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
}

// ==================== PLANNING SLOT DETAIL ====================
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
}

// ==================== JOUR PLANNING RESPONSE ====================
export class JourPlanningResponseDto {
  @ApiProperty({ description: 'Le jour est-il OFF (fermé) ?', example: false })
  isOff: boolean;

  @ApiProperty({ description: 'Liste des créneaux pour ce jour', type: [PlanningSlotDetailDto] })
  slots: PlanningSlotDetailDto[];
}

// ==================== GET PLANNINGS BY MEDECIN RESPONSE ====================
export class GetPlanningsByMedecinResponseDto {
  @ApiProperty({ description: 'ID du médecin', example: 4 })
  medecinId: number;

  @ApiProperty({ description: 'Nom complet du médecin', example: 'Dr Jean MBALLA' })
  medecinName: string;

  @ApiProperty({ description: 'Plannings groupés par jour', type: Object })
  plannings: {
    lundi: JourPlanningResponseDto;
    mardi: JourPlanningResponseDto;
    mercredi: JourPlanningResponseDto;
    jeudi: JourPlanningResponseDto;
    vendredi: JourPlanningResponseDto;
    samedi: JourPlanningResponseDto;
    dimanche: JourPlanningResponseDto;
  };
}

// ==================== GET SLOTS RESPONSE ====================
export class GetSlotsResponseDto {
  @ApiProperty({ description: 'Des créneaux sont-ils disponibles ?', example: true })
  available: boolean;

  @ApiProperty({ description: 'Date demandée', example: '2024-03-25' })
  date: string;

  @ApiProperty({ description: 'Jour de la semaine', example: 'lundi' })
  jour: string;

  @ApiProperty({ description: 'Le jour est-il OFF ?', example: false })
  isOff: boolean;

  @ApiPropertyOptional({ description: 'Message d\'information (si non disponible)', example: 'Aucun créneau disponible' })
  message?: string;

  @ApiPropertyOptional({ description: 'Message en anglais', example: 'No slots available' })
  messageE?: string;

  @ApiProperty({ description: 'Liste des créneaux disponibles', type: [SlotResponseDto] })
  slots: SlotResponseDto[];
}

// ==================== CREATE OR UPDATE PLANNINGS RESPONSE ====================
export class CreateUpdateResultDto {
  @ApiProperty({ description: 'ID du planning créé', example: 10 })
  planningId?: number;

  @ApiPropertyOptional({ description: 'Données du planning créé' })
  data?: any;
}

export class CreateUpdateErrorDto {
  @ApiProperty({ description: 'Jour concerné', example: 'lundi' })
  jour: string;

  @ApiProperty({ description: 'Message d\'erreur', example: 'Les créneaux se chevauchent' })
  error: string;
}

export class CreateUpdateDeletedDto {
  @ApiProperty({ description: 'Jour concerné', example: 'mercredi' })
  jour: string;

  @ApiProperty({ description: 'Nombre de créneaux supprimés', example: 2 })
  count: number;

  @ApiPropertyOptional({ description: 'Détails des créneaux supprimés' })
  slots?: Array<{ debutHour: string; type: string }>;
}

export class CreateOrUpdatePlanningsResponseDto {
  @ApiProperty({ description: 'Message de succès', example: 'Plannings traités: 5 créé(s), 3 mis à jour, 2 supprimé(s), 0 erreur(s)' })
  message: string;

  @ApiProperty({ description: 'Message de succès en anglais', example: 'Plannings processed: 5 created, 3 updated, 2 deleted, 0 error(s)' })
  messageE: string;

  @ApiProperty({ description: 'Résultats détaillés', type: Object })
  data: {
    created: CreateUpdateResultDto[];
    updated: CreateUpdateResultDto[];
    deleted: CreateUpdateDeletedDto[];
    errors: CreateUpdateErrorDto[];
  };
}

// ==================== UPDATE JOUR STATUS RESPONSE ====================
export class UpdateJourStatusResponseDto {
  @ApiProperty({ description: 'Message de succès', example: 'Le lundi a été marqué comme OFF' })
  message: string;

  @ApiProperty({ description: 'Message de succès en anglais', example: 'monday has been marked as OFF' })
  messageE: string;

  @ApiProperty({ description: 'Données mises à jour' })
  data: any;
}

// ==================== DELETE PLANNINGS RESPONSE ====================
export class DeletePlanningsResponseDto {
  @ApiProperty({ description: 'Message de succès', example: '5 planning(s) supprimé(s) avec succès' })
  message: string;

  @ApiProperty({ description: 'Message de succès en anglais', example: '5 planning(s) deleted successfully' })
  messageE: string;

  @ApiProperty({ description: 'Nombre de plannings supprimés', example: 5 })
  count: number;
}

// ==================== DELETE SLOT RESPONSE ====================
export class DeleteSlotResponseDto {
  @ApiProperty({ description: 'ID du planning supprimé', example: 10 })
  planningId: number;

  @ApiProperty({ description: 'ID du médecin', example: 4 })
  medecinId: number;

  @ApiProperty({ description: 'Jour de la semaine', example: 'lundi' })
  jour: string;

  @ApiProperty({ description: 'Heure de début', example: '08:00:00' })
  debutHour: string;

  @ApiProperty({ description: 'Heure de fin', example: '12:00:00' })
  endHour: string;

  @ApiProperty({ enum: PlanningType, description: 'Type de planning' })
  type: PlanningType;

  @ApiPropertyOptional({ description: 'ID de l\'hôpital', example: 1 })
  hopitalId?: number;

  @ApiPropertyOptional({ description: 'Salle de consultation', example: 'Consultation A' })
  salle?: string;

  @ApiProperty({ description: 'Le créneau est-il OFF ?', example: false })
  isOff: boolean;

  @ApiProperty({ description: 'Le planning est-il actif ?', example: true })
  isActive: boolean;
}