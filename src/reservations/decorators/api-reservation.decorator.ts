// src/reservations/decorators/api-reservation.decorator.ts
import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiForbiddenResponse,
  ApiConflictResponse,
} from '@nestjs/swagger';
import { CreateReservationDto } from '../dto/create-reservation.dto';
import { UpdateReservationDateDto } from '../dto/update-reservation-date.dto';
import { RateDoctorDto } from '../dto/rate-doctor.dto';
import {
  ReservationResponseDto,
  ReservationPaginatedResponseDto,
  SingleReservationResponseDto,
} from '../dto/reservation-response.dto';

// ==================== CREER RESERVATION ====================
export function ApiCreateReservation() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Créer une réservation',
      description: 'Crée une réservation (CALL = en ligne avec abonnement, IN_PERSON = présentiel avec paiement)',
    }),
    ApiBody({ type: CreateReservationDto }),
    ApiResponse({
      status: 201,
      description: 'Réservation créée avec succès',
      schema: {
        example: {
          success: true,
          message: 'Réservation créée avec succès',
          messageE: 'Reservation created successfully',
          reservation: {
            reservationId: 1,
            date: '2026-04-01',
            hour: '19:35',
            type: 'CALL',
            patientName: 'Aïssatou Mohaman',
            sex: 'FEMALE',
            medecinId: 7,
            patientId: 5,
            amount: 0,
            status: 'PENDING',
            usedSubscription: true,
            consultationsRestantes: 4,
            consultationPrice: 5000,
            duration: 30,
            startHour: '19:35',
            endHour: '20:05',
          },
        },
      },
    }),
    ApiBadRequestResponse({
      description: 'Données invalides',
      schema: {
        example: {
          message: 'Le patient n\'a pas d\'abonnement actif pour cette spécialité',
          messageE: 'Patient has no active subscription for this speciality',
          requiredAction: 'SUBSCRIBE',
        },
      },
    }),
    ApiNotFoundResponse({
      description: 'Médecin, patient ou hôpital non trouvé',
      schema: {
        example: {
          message: 'Médecin d\'ID 999 introuvable',
          messageE: 'Doctor with ID 999 not found',
        },
      },
    }),
    ApiForbiddenResponse({
      description: 'Accès non autorisé',
      schema: {
        example: {
          message: 'Accès non autorisé',
          messageE: 'Unauthorized access',
        },
      },
    }),
    ApiConflictResponse({
      description: 'Conflit de créneau horaire',
      schema: {
        example: {
          message: 'Chevauchement avec une autre réservation (19:35 - 20:05)',
          messageE: 'Overlaps another reservation (19:35 - 20:05)',
        },
      },
    }),
  );
}

// ==================== DEMARRER CONSULTATION ====================
export function ApiStartConsultation() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Démarrer une consultation',
      description: 'Le médecin démarre la consultation. Peut être fait 2 minutes avant l\'heure prévue ou à tout moment après.',
    }),
    ApiParam({ name: 'id', type: Number, description: 'ID de la réservation', example: 1 }),
    ApiResponse({
      status: 200,
      description: 'Consultation démarrée avec succès',
      schema: {
        example: {
          success: true,
          message: 'Consultation démarrée avec succès',
          messageE: 'Consultation started successfully',
          reservation: {
            reservationId: 1,
            date: '2026-04-01',
            hour: '19:35',
            status: 'STARTED',
          },
        },
      },
    }),
    ApiBadRequestResponse({
      description: 'Impossible de démarrer la consultation (trop tôt ou statut invalide)',
      schema: {
        example: {
          message: 'La consultation ne peut pas encore commencer. Elle est prévue à 19:35. Vous pouvez commencer 2 minutes avant l\'heure prévue (dans 15 minute(s)).',
          messageE: 'Consultation cannot start yet. It is scheduled for 19:35. You can start 2 minutes before the scheduled time (in 15 minute(s)).',
        },
      },
    }),
    ApiNotFoundResponse({
      description: 'Réservation non trouvée',
      schema: {
        example: {
          message: 'Réservation 999 introuvable',
          messageE: 'Reservation 999 not found',
        },
      },
    }),
    ApiForbiddenResponse({
      description: 'Vous n\'êtes pas autorisé à démarrer cette consultation',
      schema: {
        example: {
          message: 'Vous n\'êtes pas autorisé à démarrer cette consultation',
          messageE: 'You are not authorized to start this consultation',
        },
      },
    }),
  );
}

// ==================== TERMINER CONSULTATION ====================
export function ApiCompleteConsultation() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Terminer une consultation',
      description: 'Le médecin termine la consultation. Le paiement est effectué et le médecin/hôpital est crédité après déduction de la commission plateforme.',
    }),
    ApiParam({ name: 'id', type: Number, description: 'ID de la réservation', example: 1 }),
    ApiResponse({
      status: 200,
      description: 'Consultation terminée avec succès',
      schema: {
        example: {
          success: true,
          message: 'Consultation terminée avec succès',
          messageE: 'Consultation completed successfully',
          details: {
            reservationId: 1,
            status: 'COMPLETED',
            consultationPrice: 5000,
            platformCommission: 500,
            amountCredited: 4500,
            creditedTo: 'médecin Dr Adamou Jiraya',
          },
          reservation: {
            reservationId: 1,
            date: '2026-04-01',
            hour: '19:35',
            status: 'COMPLETED',
          },
        },
      },
    }),
    ApiBadRequestResponse({
      description: 'Impossible de terminer la consultation (trop tôt ou statut invalide)',
      schema: {
        example: {
          message: 'La consultation ne peut pas encore être terminée. La fin prévue est à 20:05. Vous pouvez terminer 5 minutes avant la fin (dans 10 minute(s)).',
          messageE: 'Consultation cannot be completed yet. The scheduled end time is 20:05. You can complete 5 minutes before the end (in 10 minute(s)).',
        },
      },
    }),
    ApiNotFoundResponse({
      description: 'Réservation non trouvée',
      schema: {
        example: {
          message: 'Réservation 999 introuvable',
          messageE: 'Reservation 999 not found',
        },
      },
    }),
    ApiForbiddenResponse({
      description: 'Vous n\'êtes pas autorisé à terminer cette consultation',
      schema: {
        example: {
          message: 'Vous n\'êtes pas autorisé à terminer cette consultation',
          messageE: 'You are not authorized to complete this consultation',
        },
      },
    }),
  );
}

// ==================== MODIFIER DATE RESERVATION ====================
export function ApiUpdateReservationDate() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Modifier date/heure d\'une réservation',
      description: 'Modifie la date et l\'heure d\'une réservation (doit être au moins 24h avant)',
    }),
    ApiParam({ name: 'id', type: Number, description: 'ID de la réservation', example: 1 }),
    ApiBody({ type: UpdateReservationDateDto }),
    ApiResponse({
      status: 200,
      description: 'Réservation modifiée avec succès',
      schema: {
        example: {
          success: true,
          message: 'Date modifiée avec succès',
          messageE: 'Date updated successfully',
          reservation: {
            reservationId: 1,
            date: '2026-04-02',
            hour: '20:10',
          },
        },
      },
    }),
    ApiBadRequestResponse({
      description: 'Date invalide ou modification trop tardive',
      schema: {
        example: {
          message: 'La modification doit être faite au moins 24h à l\'avance',
          messageE: 'Modification must be made at least 24h in advance',
        },
      },
    }),
    ApiNotFoundResponse({
      description: 'Réservation non trouvée',
      schema: {
        example: {
          message: 'Réservation 999 introuvable',
          messageE: 'Reservation 999 not found',
        },
      },
    }),
    ApiForbiddenResponse({
      description: 'Accès non autorisé',
      schema: {
        example: {
          message: 'Impossible de modifier une réservation COMPLETED',
          messageE: 'Cannot modify a COMPLETED reservation',
        },
      },
    }),
  );
}

// ==================== RESERVATION PAR ID ====================
export function ApiGetReservationById() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Obtenir une réservation par ID',
      description: 'Retourne les détails complets d\'une réservation avec les avis du médecin',
    }),
    ApiParam({ name: 'id', type: Number, description: 'ID de la réservation', example: 1 }),
    ApiResponse({
      status: 200,
      description: 'Réservation récupérée avec succès',
      type: SingleReservationResponseDto,
      schema: {
        example: {
          message: 'Réservation récupérée avec succès',
          messageE: 'Reservation retrieved successfully',
          data: {
            reservationId: 1,
            date: '2026-04-01',
            hour: '19:35',
            type: 'CALL',
            patientName: 'Aïssatou Mohaman',
            sex: 'FEMALE',
            age: 28,
            description: 'Consultation cardiologie',
            medecinId: 7,
            patientId: 5,
            amount: 0,
            status: 'PENDING',
            createdAt: '2026-03-30T10:00:00.000Z',
            endHour: '20:05',
            medecin: {
              userId: 7,
              firstName: 'Adamou',
              lastName: 'Jiraya',
              profile: 'https://example.com/profiles/adamou.jpg',
              speciality: {
                specialityId: 1,
                name: 'Cardiologie',
                consultationPrice: 5000,
                consultationDuration: 30,
              },
            },
            patient: {
              userId: 5,
              firstName: 'Aïssatou',
              lastName: 'Mohaman',
              email: 'aissatou.mohaman@hotmail.com',
              profile: 'https://example.com/profiles/aissatou.jpg',
            },
          },
          medecinRating: {
            average: 4.5,
            count: 12,
          },
          lastFeedbacks: [],
        },
      },
    }),
    ApiNotFoundResponse({
      description: 'Réservation non trouvée',
      schema: {
        example: {
          message: 'Réservation d\'ID 999 introuvable',
          messageE: 'Reservation with ID 999 not found',
        },
      },
    }),
  );
}

// ==================== LISTER RESERVATIONS ====================
export function ApiGetAllReservations() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Lister les réservations',
      description: 'Retourne la liste paginée des réservations avec filtres',
    }),
    ApiQuery({ name: 'page', required: false, type: Number, default: 1, example: 1 }),
    ApiQuery({ name: 'limit', required: false, type: Number, default: 10, example: 10 }),
    ApiQuery({ name: 'medecinId', required: false, type: Number, description: 'ID du médecin', example: 7 }),
    ApiQuery({ name: 'patientId', required: false, type: Number, description: 'ID du patient', example: 5 }),
    ApiQuery({ name: 'date', required: false, type: String, description: 'Date (YYYY-MM-DD)', example: '2026-04-01' }),
    ApiQuery({ name: 'type', required: false, enum: ['CALL', 'IN_PERSON'], description: 'Type de réservation' }),
    ApiQuery({ name: 'status', required: false, enum: ['PENDING', 'STARTED', 'COMPLETED', 'CANCELLED'], description: 'Statut de la réservation' }),
    ApiQuery({ name: 'q', required: false, type: String, description: 'Recherche textuelle (nom patient, médecin, hôpital)', example: 'Aïssatou' }),
    ApiResponse({
      status: 200,
      description: 'Liste des réservations',
      type: ReservationPaginatedResponseDto,
      schema: {
        example: {
          message: 'Réservations récupérées avec succès',
          messageE: 'Reservations retrieved successfully',
          data: [
            {
              reservationId: 1,
              date: '2026-04-01',
              hour: '19:35',
              type: 'CALL',
              patientName: 'Aïssatou Mohaman',
              sex: 'FEMALE',
              medecinId: 7,
              patientId: 5,
              amount: 0,
              status: 'PENDING',
              endHour: '20:05',
              medecin: {
                userId: 7,
                firstName: 'Adamou',
                lastName: 'Jiraya',
                profile: 'https://example.com/profiles/adamou.jpg',
                speciality: {
                  specialityId: 1,
                  name: 'Cardiologie',
                  consultationPrice: 5000,
                  consultationDuration: 30,
                },
              },
              patient: {
                userId: 5,
                firstName: 'Aïssatou',
                lastName: 'Mohaman',
                profile: 'https://example.com/profiles/aissatou.jpg',
              },
            },
          ],
          meta: {
            total: 1,
            page: 1,
            limit: 10,
            pageCount: 1,
          },
        },
      },
    }),
  );
}

// ==================== NOTER MEDECIN ====================
export function ApiRateDoctor() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Noter le médecin d\'une réservation',
      description: 'Note le médecin après une réservation complétée',
    }),
    ApiParam({ name: 'id', type: Number, description: 'ID de la réservation', example: 1 }),
    ApiBody({ type: RateDoctorDto }),
    ApiResponse({
      status: 201,
      description: 'Avis créé avec succès',
      schema: {
        example: {
          success: true,
          message: 'Avis enregistré avec succès',
          messageE: 'Feedback saved successfully',
          feedback: {
            feedbackId: 1,
            medecinId: 7,
            patientId: 5,
            note: 5,
            comment: 'Excellent médecin, très à l\'écoute',
          },
        },
      },
    }),
    ApiBadRequestResponse({
      description: 'Note invalide ou réservation non complétée',
      schema: {
        example: {
          message: 'Vous ne pouvez noter qu’après une consultation terminée',
          messageE: 'You can only rate after a completed consultation',
        },
      },
    }),
    ApiForbiddenResponse({
      description: 'Médecin ou patient ne correspond pas à la réservation',
      schema: {
        example: {
          message: 'medecinId ou patientId invalide pour cette réservation',
          messageE: 'medecinId or patientId does not match this reservation',
        },
      },
    }),
    ApiNotFoundResponse({
      description: 'Réservation non trouvée',
      schema: {
        example: {
          message: 'Réservation 999 introuvable',
          messageE: 'Reservation 999 not found',
        },
      },
    }),
  );
}