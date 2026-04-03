import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { CreateCandidatureDto } from '../dto/create-candidature.dto';
import { UpdateCandidatureDto } from '../dto/update-candidature.dto';
import { CancelCandidatureDto } from '../dto/cancel-candidature.dto';

export function ApiCreateCandidature() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Créer une ou plusieurs candidatures (ACTEUR: FRONTEND MEDECIN / ADMIN)',
      description:
        "Cette API crée une ou plusieurs candidatures en une seule requête. Le frontend doit envoyer explicitement l'ID du médecin dans le body via medecinId, la lettre de motivation, le fichier et la liste des hôpitaux ciblés. Les hôpitaux déjà affiliés au médecin sont ignorés. Les hôpitaux ayant déjà une candidature PENDING pour ce médecin sont aussi ignorés.",
    }),
    ApiBody({ type: CreateCandidatureDto }),
    ApiResponse({
      status: 201,
      description: 'Candidature(s) créée(s) avec succès',
      schema: {
        example: {
          message: '2 candidature(s) créée(s) avec succès.',
          messageE: '2 application(s) created successfully.',
          data: [
            {
              candidatureId: 1,
              description: 'Lettre de motivation...',
              file: 'https://res.cloudinary.com/.../cv.pdf',
              status: 'PENDING',
              medecinId: 7,
              hopitalId: 15,
            },
            {
              candidatureId: 2,
              description: 'Lettre de motivation...',
              file: 'https://res.cloudinary.com/.../cv.pdf',
              status: 'PENDING',
              medecinId: 7,
              hopitalId: 16,
            }
          ],
          skipped: {
            alreadyAffiliated: [12],
            alreadyPending: [14],
          },
        },
      },
    }),
  );
}

export function ApiGetAllCandidatures() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Lister les candidatures (ACTEUR: ADMIN / HOPITAL / FRONTEND MEDECIN)',
      description:
        "Cette API retourne la liste paginée des candidatures. Côté médecin, elle sert à afficher les candidatures envoyées. Côté hôpital, elle sert à afficher les candidatures reçues. Côté admin, elle sert à superviser l’ensemble.",
    }),
    ApiQuery({ name: 'search', required: false, type: String, description: 'Recherche libre' }),
    ApiQuery({ name: 'status', required: false, type: String, description: 'PENDING, CONFIRMED, CANCELLED' }),
    ApiQuery({ name: 'medecinId', required: false, type: Number, description: 'Filtre par médecin' }),
    ApiQuery({ name: 'hopitalId', required: false, type: Number, description: 'Filtre par hôpital' }),
    ApiQuery({ name: 'page', required: false, type: Number, default: 1 }),
    ApiQuery({ name: 'limit', required: false, type: Number, default: 20 }),
    ApiResponse({
      status: 200,
      description: 'Liste des candidatures récupérée avec succès',
    }),
  );
}

export function ApiGetCandidatureById() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Voir le détail d’une candidature (ACTEUR: HOPITAL / ADMIN / FRONTEND MEDECIN)',
      description:
        "Cette API retourne le détail complet d’une candidature : spécialité du médecin, informations personnelles, contenu de la candidature, total de consultations et moyenne des feedbacks sur 5.",
    }),
    ApiParam({ name: 'id', type: Number, example: 1 }),
    ApiResponse({
      status: 200,
      description: 'Candidature récupérée avec succès',
    }),
    ApiResponse({
      status: 404,
      description: 'Candidature introuvable',
    }),
  );
}

export function ApiUpdateCandidature() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Modifier une candidature (ACTEUR: propriétaire de la candidature)',
      description:
        "Cette API permet de modifier une candidature tant qu’elle est encore en attente (PENDING).",
    }),
    ApiParam({ name: 'id', type: Number, example: 1 }),
    ApiBody({ type: UpdateCandidatureDto }),
    ApiResponse({
      status: 200,
      description: 'Candidature mise à jour avec succès',
    }),
  );
}

export function ApiDeleteCandidature() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Supprimer une candidature (ACTEUR: propriétaire de la candidature)',
      description:
        "Cette API supprime manuellement une candidature.",
    }),
    ApiParam({ name: 'id', type: Number, example: 1 }),
    ApiResponse({
      status: 200,
      description: 'Candidature supprimée avec succès',
    }),
  );
}

export function ApiCancelCandidatures() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Annuler plusieurs candidatures (ACTEUR: MEDECIN / ADMIN selon le flux)',
      description:
        "Cette API annule plusieurs candidatures en attente en une seule requête. Seules les candidatures PENDING sont annulées.",
    }),
    ApiBody({ type: CancelCandidatureDto }),
    ApiResponse({
      status: 200,
      description: 'Candidature(s) annulée(s) avec succès',
      schema: {
        example: {
          message: '2 candidature(s) annulée(s) avec succès.',
          messageE: '2 application(s) cancelled successfully.',
          cancelledIds: [1, 2],
          skippedIds: [3],
        },
      },
    }),
  );
}

export function ApiAcceptCandidature() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Accepter une candidature (ACTEUR: HOPITAL destinataire)',
      description:
        "Quand l’hôpital accepte, la candidature passe à CONFIRMED et le médecin est ajouté automatiquement dans la table MedecinHopital.",
    }),
    ApiParam({ name: 'id', type: Number, example: 1 }),
    ApiResponse({
      status: 200,
      description: 'Candidature acceptée avec succès',
    }),
  );
}

export function ApiRejectCandidature() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Refuser une candidature (ACTEUR: HOPITAL destinataire)',
      description:
        "Quand l’hôpital refuse, la ligne de candidature liée à cet hôpital est supprimée.",
    }),
    ApiParam({ name: 'id', type: Number, example: 1 }),
    ApiResponse({
      status: 200,
      description: 'Candidature refusée et supprimée avec succès',
    }),
  );
}