// src/planning/decorators/api-planning.decorator.ts
import { applyDecorators } from '@nestjs/common';
import { 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody
} from '@nestjs/swagger';
import { CreatePlanningDto } from '../dto/create-planning.dto';
import { UpdateJourStatusDto } from '../dto/update-jour-status.dto';
import { PlanningType } from 'generated/prisma';

// ==================== INTERFACES ====================

export interface PlanningSlotResponse {
  planningId: number;
  debutHour: string;
  endHour: string;
  type: 'ONLINE' | 'IN_PERSON';
  hopitalId?: number;
  hopitalName?: string;
  hopitalAddress?: string;
  salle?: string;
}

export interface JourPlanningResponse {
  isOff: boolean;
  slots: PlanningSlotResponse[];
}

export interface GetPlanningsByMedecinResponse {
  medecinId: number;
  medecinName: string;
  plannings: {
    lundi: JourPlanningResponse;
    mardi: JourPlanningResponse;
    mercredi: JourPlanningResponse;
    jeudi: JourPlanningResponse;
    vendredi: JourPlanningResponse;
    samedi: JourPlanningResponse;
    dimanche: JourPlanningResponse;
  };
}

export interface AvailableSlotResponse {
  start: string;
  end: string;
  type: 'ONLINE' | 'IN_PERSON';
  hopitalId?: number;
  hopitalName?: string;
  hopitalAddress?: string;
  salle?: string;
}

export interface GetSlotsResponse {
  available: boolean;
  date: string;
  jour: string;
  isOff: boolean;
  message?: string;
  messageE?: string;
  slots: AvailableSlotResponse[];
}

export interface CreateUpdateResult {
  created: any[];
  updated: any[];
  deleted: Array<{ jour: string; count: number; slots?: any[] }>;
  errors: Array<{ jour: string; error: string }>;
}

export interface CreateOrUpdatePlanningsResponse {
  message: string;
  messageE: string;
  data: CreateUpdateResult;
}

export interface UpdateJourStatusResponse {
  message: string;
  messageE: string;
  data: any;
}

export interface DeletePlanningsResponse {
  message: string;
  messageE: string;
  count: number;
}

export interface DeleteSlotResponse {
  planningId: number;
  medecinId: number;
  jour: string;
  debutHour: string;
  endHour: string;
  type: 'ONLINE' | 'IN_PERSON';
  hopitalId?: number;
  salle?: string;
  isOff: boolean;
  isActive: boolean;
}

// ==================== CREATE OR UPDATE PLANNINGS ====================
export function ApiCreateOrUpdatePlannings() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({ 
      summary: 'Créer ou mettre à jour les plannings',
      description: 'Crée ou met à jour tous les plannings d\'un médecin. Permet de gérer les jours OFF.'
    }),
    ApiBody({ type: CreatePlanningDto }),
    ApiResponse({
      status: 201,
      description: 'Plannings traités avec succès',
      schema: {
        example: {
          message: 'Plannings traités: 5 créé(s), 3 mis à jour, 2 supprimé(s), 0 erreur(s)',
          messageE: 'Plannings processed: 5 created, 3 updated, 2 deleted, 0 error(s)',
          data: {
            created: [
              {
                planningId: 10,
                medecinId: 4,
                jour: 'lundi',
                debutHour: '08:00:00',
                endHour: '12:00:00',
                type: 'IN_PERSON',
                hopitalId: 1,
                salle: 'Consultation A',
                isOff: false,
                isActive: true
              }
            ],
            updated: [],
            deleted: [],
            errors: []
          }
        }
      }
    }),
    ApiResponse({
      status: 400,
      description: 'Données invalides'
    }),
    ApiResponse({
      status: 404,
      description: 'Médecin non trouvé'
    })
  );
}

// ==================== UPDATE JOUR STATUS ====================
export function ApiUpdateJourStatus() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({ 
      summary: 'Mettre à jour le statut OFF d\'un jour',
      description: 'Permet de marquer un jour complet comme indisponible (OFF) ou de le réactiver'
    }),
    ApiParam({ name: 'medecinId', type: Number, description: 'ID du médecin' }),
    ApiBody({ type: UpdateJourStatusDto }),
    ApiResponse({
      status: 200,
      description: 'Statut mis à jour avec succès',
      schema: {
        example: {
          message: 'Le lundi a été marqué comme OFF',
          messageE: 'monday has been marked as OFF',
          data: {
            planningId: 1,
            medecinId: 4,
            jour: 'lundi',
            debutHour: '00:00:00',
            endHour: '00:00:00',
            type: 'ONLINE',
            hopitalId: 0,
            isOff: true,
            isActive: true
          }
        }
      }
    }),
    ApiResponse({
      status: 404,
      description: 'Médecin non trouvé'
    })
  );
}

// ==================== GET PLANNINGS BY MEDECIN ====================
export function ApiGetPlanningsByMedecin() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({ 
      summary: 'Récupérer les plannings d\'un médecin',
      description: 'Retourne tous les plannings d\'un médecin, groupés par jour avec les statuts OFF'
    }),
    ApiParam({ name: 'medecinId', type: Number, description: 'ID du médecin' }),
    ApiResponse({
      status: 200,
      description: 'Plannings récupérés avec succès',
      schema: {
        example: {
          medecinId: 4,
          medecinName: 'Dr Jean MBALLA',
          plannings: {
            lundi: {
              isOff: false,
              slots: [
                {
                  planningId: 10,
                  debutHour: '08:00:00',
                  endHour: '12:00:00',
                  type: 'IN_PERSON',
                  hopitalId: 1,
                  hopitalName: 'Hôpital Central',
                  hopitalAddress: 'Boulevard du 20 Mai',
                  salle: 'Consultation A'
                }
              ]
            },
            mardi: {
              isOff: false,
              slots: [
                {
                  planningId: 11,
                  debutHour: '14:00:00',
                  endHour: '18:00:00',
                  type: 'ONLINE',
                  hopitalId: null,
                  hopitalName: null,
                  hopitalAddress: null,
                  salle: null
                }
              ]
            },
            mercredi: {
              isOff: true,
              slots: []
            },
            jeudi: {
              isOff: false,
              slots: []
            },
            vendredi: {
              isOff: false,
              slots: []
            },
            samedi: {
              isOff: false,
              slots: []
            },
            dimanche: {
              isOff: false,
              slots: []
            }
          }
        }
      }
    }),
    ApiResponse({
      status: 404,
      description: 'Médecin non trouvé'
    })
  );
}

// ==================== GET AVAILABLE SLOTS ====================
export function ApiGetSlots() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({ 
      summary: 'Récupérer les créneaux disponibles',
      description: 'Retourne la liste des créneaux disponibles pour un médecin à une date donnée'
    }),
    ApiQuery({ name: 'medecinId', type: Number, required: true, description: 'ID du médecin' }),
    ApiQuery({ name: 'date', type: String, required: true, description: 'Date (YYYY-MM-DD)' }),
    ApiQuery({ name: 'type', enum: PlanningType, required: false, description: 'Type de créneaux' }),
    ApiQuery({ name: 'hopitalId', type: Number, required: false, description: 'ID de l\'hôpital' }),
    ApiResponse({
      status: 200,
      description: 'Créneaux récupérés avec succès',
      schema: {
        example: {
          available: true,
          date: '2024-03-25',
          jour: 'lundi',
          isOff: false,
          slots: [
            {
              start: '08:00:00',
              end: '08:30:00',
              type: 'IN_PERSON',
              hopitalId: 1,
              hopitalName: 'Hôpital Central',
              hopitalAddress: 'Boulevard du 20 Mai',
              salle: 'Consultation A'
            }
          ]
        }
      }
    }),
    ApiResponse({
      status: 400,
      description: 'Paramètres invalides'
    }),
    ApiResponse({
      status: 404,
      description: 'Médecin non trouvé'
    })
  );
}

// ==================== DELETE ALL PLANNINGS ====================
export function ApiDeleteAllPlannings() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({ 
      summary: 'Supprimer tous les plannings d\'un médecin',
      description: 'Supprime tous les plannings (créneaux) d\'un médecin'
    }),
    ApiParam({ name: 'medecinId', type: Number, description: 'ID du médecin' }),
    ApiResponse({
      status: 200,
      description: 'Plannings supprimés avec succès',
      schema: {
        example: {
          message: '5 planning(s) supprimé(s) avec succès',
          messageE: '5 planning(s) deleted successfully',
          count: 5
        }
      }
    }),
    ApiResponse({
      status: 404,
      description: 'Médecin non trouvé'
    }),
    ApiResponse({
      status: 409,
      description: 'Des réservations futures existent'
    })
  );
}

// ==================== DELETE SINGLE SLOT ====================
export function ApiDeleteSlot() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({ 
      summary: 'Supprimer un créneau spécifique',
      description: 'Supprime un créneau unique'
    }),
    ApiParam({ name: 'planningId', type: Number, description: 'ID du planning' }),
    ApiResponse({
      status: 200,
      description: 'Créneau supprimé avec succès',
      schema: {
        example: {
          planningId: 10,
          medecinId: 4,
          jour: 'lundi',
          debutHour: '08:00:00',
          endHour: '12:00:00',
          type: 'IN_PERSON',
          hopitalId: 1,
          salle: 'Consultation A',
          isOff: false,
          isActive: true
        }
      }
    }),
    ApiResponse({
      status: 404,
      description: 'Planning non trouvé'
    }),
    ApiResponse({
      status: 409,
      description: 'Des réservations futures existent sur ce créneau'
    })
  );
}