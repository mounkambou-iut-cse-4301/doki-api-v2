// src/planning/decorators/api-planning.decorator.ts
import { applyDecorators } from '@nestjs/common';
import { 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiExtraModels,
  getSchemaPath
} from '@nestjs/swagger';
import { CreatePlanningDto, PlanningSlotDto, JourPlanningDto } from '../dto/create-planning.dto';
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
  consultationPrice?: number;
  consultationDuration?: number;
}

export interface JourPlanningResponse {
  isOff: boolean;
  slots: PlanningSlotResponse[];
}

export interface GetPlanningsByMedecinResponse {
  medecinId: number;
  medecinName: string;
  defaultOnlinePrice: number;
  defaultOnlineDuration: number;
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
  price: number;
  duration: number;
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
  errors: Array<{ jour: string; slot?: string; error: string }>;
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
      description: `Crée ou met à jour tous les plannings d'un médecin.
      
**IMPORTANT:**
- Pour les créneaux **ONLINE**: Ne pas inclure \`consultationPrice\` et \`consultationDuration\` (ils sont ignorés, les valeurs de la spécialité sont utilisées)
- Pour les créneaux **IN_PERSON**: \`consultationPrice\` et \`consultationDuration\` sont OBLIGATOIRES
- \`hopitalId\` est OBLIGATOIRE pour les créneaux IN_PERSON`
    }),
    ApiBody({ 
      type: CreatePlanningDto,
      examples: {
        'Créneaux ONLINE (sans prix/durée)': {
          summary: 'Exemple pour créneaux en ligne',
          description: 'Pour les créneaux ONLINE, on n\'envoie PAS consultationPrice et consultationDuration',
          value: {
            medecinId: 4,
            plannings: [
              {
                jour: "lundi",
                isOff: false,
                slots: [
                  {
                    debutHour: "09:00:00",
                    endHour: "13:00:00",
                    type: "ONLINE"
                  },
                    {
                    debutHour: "14:00:00",
                    endHour: "18:00:00",
                    type: "IN_PERSON",
                    hopitalId: 1,
                    salle: "Consultation A",
                    consultationPrice: 15000,
                    consultationDuration: 30
                  }
                ]
              },
              {
                jour: "mercredi",
                isOff: false,
                slots: [
                  {
                    debutHour: "14:00:00",
                    endHour: "18:00:00",
                    type: "IN_PERSON",
                    hopitalId: 1,
                    salle: "Consultation B",
                    consultationPrice: 18000,
                    consultationDuration: 30

                  },
                    {
                    debutHour: "19:00:00",
                    endHour: "22:00:00",
                    type: "ONLINE"
                  }
                ]
              }
            ]
          }
        },
        'Créneaux IN_PERSON (avec prix et durée)': {
          summary: 'Exemple pour créneaux en présentiel',
          description: 'Pour les créneaux IN_PERSON, consultationPrice et consultationDuration sont OBLIGATOIRES',
          value: {
            medecinId: 4,
            plannings: [
              {
                jour: "mardi",
                isOff: false,
                slots: [
                  {
                    debutHour: "08:00:00",
                    endHour: "12:00:00",
                    type: "IN_PERSON",
                    hopitalId: 1,
                    salle: "Consultation A",
                    consultationPrice: 15000,
                    consultationDuration: 30
                  }
                ]
              },
              {
                jour: "jeudi",
                isOff: false,
                slots: [
                  {
                    debutHour: "14:00:00",
                    endHour: "18:00:00",
                    type: "IN_PERSON",
                    hopitalId: 1,
                    salle: "Consultation B",
                    consultationPrice: 20000,
                    consultationDuration: 45
                  }
                ]
              }
            ]
          }
        },
        'Créneaux MIXTES (online + in_person)': {
          summary: 'Exemple mixte',
          description: 'Combinaison de créneaux en ligne et en présentiel',
          value: {
            medecinId: 4,
            plannings: [
              {
                jour: "lundi",
                isOff: false,
                slots: [
                  {
                    debutHour: "08:00:00",
                    endHour: "12:00:00",
                    type: "IN_PERSON",
                    hopitalId: 1,
                    salle: "Consultation A",
                    consultationPrice: 15000,
                    consultationDuration: 30
                  },
                  {
                    debutHour: "14:00:00",
                    endHour: "18:00:00",
                    type: "ONLINE"
                  }
                ]
              },
              {
                jour: "mercredi",
                isOff: false,
                slots: [
                  {
                    debutHour: "09:00:00",
                    endHour: "13:00:00",
                    type: "ONLINE"
                  },
                  {
                    debutHour: "15:00:00",
                    endHour: "19:00:00",
                    type: "IN_PERSON",
                    hopitalId: 1,
                    salle: "Consultation B",
                    consultationPrice: 18000,
                    consultationDuration: 30
                  }
                ]
              }
            ]
          }
        },
        'Créneaux avec tarifs variables (matin/soir)': {
          summary: 'Tarifs différents selon l\'horaire',
          description: 'Exemple avec des tarifs différents pour le matin et le soir',
          value: {
            medecinId: 4,
            plannings: [
              {
                jour: "lundi",
                isOff: false,
                slots: [
                  {
                    debutHour: "08:00:00",
                    endHour: "12:00:00",
                    type: "IN_PERSON",
                    hopitalId: 1,
                    salle: "Consultation A",
                    consultationPrice: 10000,
                    consultationDuration: 30
                  },
                  {
                    debutHour: "17:00:00",
                    endHour: "22:00:00",
                    type: "IN_PERSON",
                    hopitalId: 1,
                    salle: "Consultation A",
                    consultationPrice: 20000,
                    consultationDuration: 30
                  }
                ]
              }
            ]
          }
        }
      }
    }),
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
                consultationPrice: 15000,
                consultationDuration: 30,
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
      description: 'Données invalides',
      schema: {
        example: {
          message: 'Plannings traités: 0 créé(s), 0 mis à jour, 0 supprimé(s), 2 erreur(s)',
          data: {
            created: [],
            updated: [],
            deleted: [],
            errors: [
              {
                jour: "lundi",
                slot: "14:00:00-18:00:00 (IN_PERSON)",
                error: "Le prix de consultation est obligatoire pour un créneau en présentiel"
              },
              {
                jour: "mardi",
                slot: "09:00:00-12:00:00 (IN_PERSON)",
                error: "La durée de consultation est obligatoire pour un créneau en présentiel"
              }
            ]
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
            hopitalId: null,
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
          defaultOnlinePrice: 10000,
          defaultOnlineDuration: 30,
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
                  salle: 'Consultation A',
                  consultationPrice: 15000,
                  consultationDuration: 30
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
                  salle: null,
                  consultationPrice: null,
                  consultationDuration: null
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
    ApiQuery({ name: 'type', enum: PlanningType, required: false, description: 'Type de créneaux (ONLINE ou IN_PERSON)' }),
    ApiQuery({ name: 'hopitalId', type: Number, required: false, description: 'ID de l\'hôpital (pour filtrer les créneaux en présentiel)' }),
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
              salle: 'Consultation A',
              price: 15000,
              duration: 30
            },
            {
              start: '08:35:00',
              end: '09:05:00',
              type: 'IN_PERSON',
              hopitalId: 1,
              hopitalName: 'Hôpital Central',
              hopitalAddress: 'Boulevard du 20 Mai',
              salle: 'Consultation A',
              price: 15000,
              duration: 30
            },
            {
              start: '14:00:00',
              end: '14:30:00',
              type: 'ONLINE',
              hopitalId: null,
              hopitalName: null,
              hopitalAddress: null,
              salle: null,
              price: 10000,
              duration: 30
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