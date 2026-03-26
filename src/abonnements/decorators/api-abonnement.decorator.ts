import { applyDecorators } from '@nestjs/common';
import { 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody
} from '@nestjs/swagger';
import { CreateAbonnementDto } from '../dto/create-abonnement.dto';
import { AbonnementResponseDto, AbonnementPaginatedResponseDto } from '../dto/abonnement-response.dto';

// ==================== SOUSCRIRE PACKAGE ====================
export function ApiSubscribePackage() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({ 
      summary: 'Souscrire à un package de groupe',
      description: 'Crée un abonnement pour un patient à un package de groupe'
    }),
    ApiBody({ type: CreateAbonnementDto }),
    ApiResponse({
      status: 201,
      description: 'Abonnement créé avec succès',
      type: AbonnementResponseDto
    }),
    ApiResponse({
      status: 400,
      description: 'Données invalides'
    }),
    ApiResponse({
      status: 404,
      description: 'Package ou patient non trouvé'
    }),
    ApiResponse({
      status: 409,
      description: 'Abonnement actif existe déjà'
    })
  );
}

// ==================== ABONNEMENTS ACTIFS ====================
export function ApiGetAbonnementsActifs() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({ 
      summary: 'Visualiser ses abonnements actifs',
      description: 'Retourne les abonnements actifs du patient'
    }),
    ApiQuery({ name: 'userId', required: true, type: Number, description: 'ID du patient' }),
    ApiQuery({ name: 'page', required: false, type: Number, default: 1 }),
    ApiQuery({ name: 'limit', required: false, type: Number, default: 10 }),
    ApiResponse({
      status: 200,
      description: 'Liste des abonnements actifs',
      type: AbonnementPaginatedResponseDto
    })
  );
}

// ==================== HISTORIQUE ABONNEMENTS ====================
export function ApiGetHistoriqueAbonnements() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({ 
      summary: 'Consulter l\'historique des abonnements',
      description: 'Retourne l\'historique complet des abonnements du patient'
    }),
    ApiQuery({ name: 'userId', required: true, type: Number, description: 'ID du patient' }),
    ApiQuery({ name: 'page', required: false, type: Number, default: 1 }),
    ApiQuery({ name: 'limit', required: false, type: Number, default: 10 }),
    ApiQuery({ name: 'status', required: false, enum: ['PENDING', 'CONFIRMED'], description: 'Filtrer par statut' }),
    ApiQuery({ name: 'packageId', required: false, type: Number, description: 'Filtrer par package' }),
    ApiQuery({ name: 'specialityId', required: false, type: Number, description: 'Filtrer par spécialité' }),
    ApiResponse({
      status: 200,
      description: 'Historique des abonnements',
      type: AbonnementPaginatedResponseDto
    })
  );
}

// ==================== ABONNEMENTS PAR SPÉCIALITÉ (MÉDECIN) ====================
export function ApiGetAbonnementsBySpecialite() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({ 
      summary: 'Médecin: Voir les abonnements de sa spécialité',
      description: 'Retourne tous les abonnements pour les patients ayant souscrit à des packages de la spécialité du médecin'
    }),
    ApiQuery({ name: 'userId', required: true, type: Number, description: 'ID du médecin' }),
    ApiQuery({ name: 'status', required: false, enum: ['PENDING', 'CONFIRMED'], description: 'Filtrer par statut' }),
    ApiQuery({ name: 'active', required: false, type: Boolean, description: 'Uniquement les actifs' }),
    ApiQuery({ name: 'page', required: false, type: Number, default: 1 }),
    ApiQuery({ name: 'limit', required: false, type: Number, default: 10 }),
    ApiResponse({
      status: 200,
      description: 'Liste des abonnements de la spécialité',
      type: AbonnementPaginatedResponseDto
    })
  );
}

// ==================== DETAIL ABONNEMENT ====================
export function ApiGetAbonnementById() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({ 
      summary: 'Obtenir les détails d\'un abonnement',
      description: 'Retourne les détails complets d\'un abonnement avec le patient et le package'
    }),
    ApiParam({ name: 'id', type: Number, description: 'ID de l\'abonnement', example: 1 }),
    ApiResponse({
      status: 200,
      description: 'Détails de l\'abonnement',
      type: AbonnementResponseDto
    }),
    ApiResponse({
      status: 404,
      description: 'Abonnement non trouvé'
    })
  );
}

// ==================== CONFIRMER ABONNEMENT ====================
export function ApiConfirmAbonnement() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({ 
      summary: 'Confirmer un abonnement (simulation paiement)',
      description: 'Confirme manuellement un abonnement (pour simulation)'
    }),
    ApiParam({ name: 'id', type: Number, description: 'ID de l\'abonnement', example: 1 }),
    ApiResponse({
      status: 200,
      description: 'Abonnement confirmé avec succès',
      schema: {
        example: {
          message: 'Abonnement confirmé avec succès',
          messageE: 'Subscription confirmed successfully',
          abonnement: {
            abonnementId: 1,
            patientId: 5,
            packageId: 1,
            status: 'CONFIRMED',
            debutDate: '2026-03-25T00:00:00.000Z',
            endDate: '2026-04-24T00:00:00.000Z',
            amount: 25000,
            numberOfTimePlanReservation: 5
          }
        }
      }
    })
  );
}

// ==================== LISTER TOUS ABONNEMENTS ====================
export function ApiGetAllAbonnements() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({ 
      summary: 'Lister tous les abonnements',
      description: 'Retourne la liste paginée des abonnements (admin)'
    }),
    ApiResponse({
      status: 200,
      description: 'Liste des abonnements',
      type: AbonnementPaginatedResponseDto
    })
  );
}