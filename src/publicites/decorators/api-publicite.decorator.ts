import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { CreatePackagePubliciteDto } from '../dto/create-package-publicite.dto';
import { UpdatePackagePubliciteDto } from '../dto/update-package-publicite.dto';
import { CreatePubliciteDto } from '../dto/create-publicite.dto';
import { UpdatePubliciteDto } from '../dto/update-publicite.dto';

export function ApiCreatePackagePublicite() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Créer un package publicité (ACTEUR: ADMIN / SUPERADMIN)',
      description:
        "Cette API crée un package de publicité. Le package définit la durée, le montant, la cible d’audience (MEDECIN, PATIENT,LES_DEUX), le nombre maximum d’images, le nombre maximum de vidéos et la durée maximale d’une vidéo. La vidéo ne doit jamais dépasser 30 secondes.",
    }),
    ApiBody({ type: CreatePackagePubliciteDto }),
    ApiResponse({ status: 201, description: 'Package publicité créé avec succès' }),
  );
}

export function ApiUpdatePackagePublicite() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Modifier un package publicité (ACTEUR: ADMIN / SUPERADMIN)',
      description:
        "Cette API modifie un package de publicité existant.",
    }),
    ApiParam({ name: 'id', type: Number, example: 1 }),
    ApiBody({ type: UpdatePackagePubliciteDto }),
    ApiResponse({ status: 200, description: 'Package publicité mis à jour avec succès' }),
  );
}
export function ApiGetAllPublicitesVisibles() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Lister les publicités visibles (ACTEUR: FRONTEND APP)',
      description:
        "Cette API retourne uniquement les publicités valides à afficher. Une publicité visible est une publicité ACTIVE, payée, et dont la période est encore valide : dateDebut <= maintenant <= dateFin.",
    }),
    ApiQuery({ name: 'search', required: false, type: String }),
    ApiQuery({ name: 'cibleAudience', required: false, type: String }),
    ApiQuery({ name: 'page', required: false, type: Number, default: 1 }),
    ApiQuery({ name: 'limit', required: false, type: Number, default: 20 }),
    ApiResponse({
      status: 200,
      description: 'Liste des publicités visibles récupérée avec succès',
    }),
  );
}

export function ApiGetAllPublicitesAdmin() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Lister toutes les publicités côté admin (ACTEUR: ADMIN / SUPERADMIN)',
      description:
        "Cette API retourne toutes les publicités confondues pour l’administration, peu importe leur statut. Elle permet de filtrer par statut, cible, package, téléverseur, annonceur et plage de dates.",
    }),
    ApiQuery({ name: 'search', required: false, type: String }),
    ApiQuery({ name: 'statut', required: false, type: String }),
    ApiQuery({ name: 'cibleAudience', required: false, type: String }),
    ApiQuery({ name: 'packagePubliciteId', required: false, type: Number }),
    ApiQuery({ name: 'televerseParId', required: false, type: Number }),
    ApiQuery({ name: 'annonceurUtilisateurId', required: false, type: Number }),
    ApiQuery({ name: 'dateDebutMin', required: false, type: String }),
    ApiQuery({ name: 'dateDebutMax', required: false, type: String }),
    ApiQuery({ name: 'dateFinMin', required: false, type: String }),
    ApiQuery({ name: 'dateFinMax', required: false, type: String }),
    ApiQuery({ name: 'page', required: false, type: Number, default: 1 }),
    ApiQuery({ name: 'limit', required: false, type: Number, default: 20 }),
    ApiResponse({
      status: 200,
      description: 'Liste admin de toutes les publicités récupérée avec succès',
    }),
  );
}
export function ApiGetAllPackagesPublicite() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Lister les packages publicité (ACTEUR: FRONTEND / ADMIN / UTILISATEUR)',
      description:
        "Cette API retourne la liste paginée des packages publicité avec filtres. Elle permet au frontend de rechercher un package par nom, description, cible audience, état actif, plage de montant et plage de durée.",
    }),
    ApiQuery({
      name: 'search',
      required: false,
      type: String,
      description: 'Recherche sur nom et description',
    }),
    ApiQuery({
      name: 'cibleAudience',
      required: false,
      type: String,
      description: 'MEDECIN, PATIENT ou LES_DEUX',
    }),
    ApiQuery({
      name: 'actif',
      required: false,
      type: Boolean,
      description: 'true ou false',
    }),
    ApiQuery({
      name: 'montantMin',
      required: false,
      type: Number,
      description: 'Montant minimum',
    }),
    ApiQuery({
      name: 'montantMax',
      required: false,
      type: Number,
      description: 'Montant maximum',
    }),
    ApiQuery({
      name: 'dureeJoursMin',
      required: false,
      type: Number,
      description: 'Durée minimale en jours',
    }),
    ApiQuery({
      name: 'dureeJoursMax',
      required: false,
      type: Number,
      description: 'Durée maximale en jours',
    }),
    ApiQuery({
      name: 'page',
      required: false,
      type: Number,
      default: 1,
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      type: Number,
      default: 20,
    }),
    ApiResponse({
      status: 200,
      description: 'Liste des packages récupérée avec succès',
    }),
  );
}

export function ApiGetPackagePubliciteById() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Voir un package publicité (ACTEUR: FRONTEND / ADMIN)',
      description: "Retourne le détail complet d’un package publicité.",
    }),
    ApiParam({ name: 'id', type: Number, example: 1 }),
    ApiResponse({ status: 200, description: 'Package récupéré avec succès' }),
  );
}

export function ApiCreatePublicite() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Créer une publicité (ACTEUR: utilisateur qui téléverse)',
      description:
        "Cette API crée une publicité à partir d’un package. televerseParId est obligatoire. Il faut toujours préciser dateDebut pour indiquer à partir de quand la publicité doit commencer. dateFin est calculée automatiquement selon la durée du package. Si le téléverseur est admin ou superadmin, le paiement est confirmé immédiatement. Sinon, la transaction est d’abord en attente puis confirmée automatiquement après 10 secondes.",
    }),
    ApiBody({ type: CreatePubliciteDto }),
    ApiResponse({ status: 201, description: 'Publicité créée avec succès' }),
  );
}

export function ApiGetAllPublicites() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Lister les publicités visibles (ACTEUR: FRONTEND APP)',
      description:
        "Cette API retourne uniquement les publicités payées, actives et dont la période est actuellement valide. En pratique, seules les publicités avec paiement confirmé, dateDebut <= maintenant <= dateFin sont retournées. Le frontend reçoit donc directement les publicités prêtes à afficher, avec dateDebut et dateFin.",
    }),
    ApiQuery({ name: 'search', required: false, type: String }),
    ApiQuery({ name: 'cibleAudience', required: false, type: String }),
    ApiQuery({ name: 'page', required: false, type: Number, default: 1 }),
    ApiQuery({ name: 'limit', required: false, type: Number, default: 20 }),
    ApiResponse({ status: 200, description: 'Liste des publicités visibles récupérée avec succès' }),
  );
}

export function ApiGetPubliciteById() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Voir une publicité (ACTEUR: FRONTEND / ADMIN / TÉLÉVERSEUR)',
      description:
        "Retourne le détail complet d’une publicité avec ses médias, son annonceur, son téléverseur, sa transaction, sa dateDebut et sa dateFin.",
    }),
    ApiParam({ name: 'id', type: Number, example: 1 }),
    ApiResponse({ status: 200, description: 'Publicité récupérée avec succès' }),
  );
}

export function ApiUpdatePublicite() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Modifier une publicité (ACTEUR: TÉLÉVERSEUR / ADMIN)',
      description:
        "Cette API permet de modifier une publicité tant qu’elle n’est pas déjà démarrée ou terminée. Si dateDebut est modifiée, dateFin est recalculée automatiquement. Si medias est fourni, la liste existante est remplacée entièrement.",
    }),
    ApiParam({ name: 'id', type: Number, example: 1 }),
    ApiBody({ type: UpdatePubliciteDto }),
    ApiResponse({ status: 200, description: 'Publicité mise à jour avec succès' }),
  );
}

export function ApiCancelPublicite() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Annuler une publicité (ACTEUR: TÉLÉVERSEUR / ADMIN)',
      description:
        "Cette API annule une publicité. Elle est utile si la campagne ne doit plus être affichée.",
    }),
    ApiParam({ name: 'id', type: Number, example: 1 }),
    ApiResponse({ status: 200, description: 'Publicité annulée avec succès' }),
  );
}

export function ApiTerminatePublicite() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Terminer une publicité (ACTEUR: TÉLÉVERSEUR / ADMIN)',
      description:
        "Cette API termine manuellement une publicité avant sa date de fin si nécessaire.",
    }),
    ApiParam({ name: 'id', type: Number, example: 1 }),
    ApiResponse({ status: 200, description: 'Publicité terminée avec succès' }),
  );
}