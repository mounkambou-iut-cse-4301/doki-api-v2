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

// ==================== PACKAGE PUBLICITE ====================

// 1. CREATE PACKAGE PUBLICITE
export function ApiCreatePackagePublicite() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Créer un package publicité (ACTEUR: ADMIN / SUPERADMIN)',
      description:
        "Cette API crée un package de publicité. Le package définit la durée, le montant, la cible d’audience (MEDECIN, PATIENT, LES_DEUX), le nombre maximum d’images, le nombre maximum de vidéos et la durée maximale d’une vidéo. La vidéo ne doit jamais dépasser 30 secondes.",
    }),
    ApiBody({ type: CreatePackagePubliciteDto }),
    ApiResponse({
      status: 201,
      description: 'Package publicité créé avec succès',
      schema: {
        example: {
          message: 'Package publicité créé avec succès',
          messageE: 'Advertising package created successfully',
          data: {
            packagePubliciteId: 1,
            nom: 'Pack Mixte 7 jours',
            description: 'Pack pour afficher une publicité pendant 7 jours',
            dureeJours: 7,
            montant: 25000,
            cibleAudience: 'LES_DEUX',
            nombreMaxImages: 5,
            nombreMaxVideos: 1,
            dureeMaxVideoSecondes: 30,
            actif: true,
            createdAt: '2026-04-11T10:00:00.000Z',
            updatedAt: '2026-04-11T10:00:00.000Z',
          },
        },
      },
    }),
    ApiResponse({ status: 400, description: 'Données invalides' }),
  );
}

// 2. UPDATE PACKAGE PUBLICITE
export function ApiUpdatePackagePublicite() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Modifier un package publicité (ACTEUR: ADMIN / SUPERADMIN)',
      description: "Cette API modifie un package de publicité existant.",
    }),
    ApiParam({ name: 'id', type: Number, example: 1 }),
    ApiBody({ type: UpdatePackagePubliciteDto }),
    ApiResponse({
      status: 200,
      description: 'Package publicité mis à jour avec succès',
      schema: {
        example: {
          message: 'Package publicité mis à jour avec succès',
          messageE: 'Advertising package updated successfully',
          data: {
            packagePubliciteId: 1,
            nom: 'Pack Mixte 10 jours',
            description: 'Pack pour afficher une publicité pendant 10 jours',
            dureeJours: 10,
            montant: 35000,
            cibleAudience: 'LES_DEUX',
            nombreMaxImages: 5,
            nombreMaxVideos: 2,
            dureeMaxVideoSecondes: 30,
            actif: true,
            createdAt: '2026-04-11T10:00:00.000Z',
            updatedAt: '2026-04-11T10:30:00.000Z',
          },
        },
      },
    }),
    ApiResponse({ status: 404, description: 'Package introuvable' }),
  );
}

// 3. GET ALL PACKAGES PUBLICITE
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
      schema: {
        example: {
          message: 'Liste des packages publicité récupérée avec succès',
          messageE: 'Advertising packages retrieved successfully',
          data: [
            {
              packagePubliciteId: 1,
              nom: 'Pack Mixte 7 jours',
              description: 'Pack pour afficher une publicité pendant 7 jours',
              dureeJours: 7,
              montant: 25000,
              cibleAudience: 'LES_DEUX',
              nombreMaxImages: 5,
              nombreMaxVideos: 1,
              dureeMaxVideoSecondes: 30,
              actif: true,
              createdAt: '2026-04-11T10:00:00.000Z',
              updatedAt: '2026-04-11T10:00:00.000Z',
            },
          ],
          meta: {
            total: 10,
            page: 1,
            limit: 20,
            pageCount: 1,
          },
        },
      },
    }),
  );
}

// 4. GET PACKAGE PUBLICITE BY ID
export function ApiGetPackagePubliciteById() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Voir un package publicité (ACTEUR: FRONTEND / ADMIN)',
      description: "Retourne le détail complet d’un package publicité.",
    }),
    ApiParam({ name: 'id', type: Number, example: 1 }),
    ApiResponse({
      status: 200,
      description: 'Package récupéré avec succès',
      schema: {
        example: {
          message: 'Package publicité récupéré avec succès',
          messageE: 'Advertising package retrieved successfully',
          data: {
            packagePubliciteId: 1,
            nom: 'Pack Mixte 7 jours',
            description: 'Pack pour afficher une publicité pendant 7 jours',
            dureeJours: 7,
            montant: 25000,
            cibleAudience: 'LES_DEUX',
            nombreMaxImages: 5,
            nombreMaxVideos: 1,
            dureeMaxVideoSecondes: 30,
            actif: true,
            createdAt: '2026-04-11T10:00:00.000Z',
            updatedAt: '2026-04-11T10:00:00.000Z',
          },
        },
      },
    }),
    ApiResponse({ status: 404, description: 'Package introuvable' }),
  );
}

// ==================== PUBLICITE ====================

// 5. CREATE PUBLICITE
export function ApiCreatePublicite() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Créer une publicité (ACTEUR: utilisateur qui téléverse: ADMIN, SUPERADMIN ET MEDECN)',
      description:
        "Cette API crée une publicité à partir d’un package. televerseParId est obligatoire car cest celui qui téléverse et ça peut etre soit l'admin, soit le medecin. annonceurUtilisateurId c'est celui qui a demandé pour faire l'annonce, si c'est le medecin qui est sur la plateforme tu mets son id, au contraire annonceurUtilisateurId ne sra pas mis dans ce input. Il faut toujours préciser dateDebut pour indiquer à partir de quand la publicité doit commencer. dateFin est calculée automatiquement selon la durée du package. Si le téléverseur est admin ou superadmin, le paiement est confirmé immédiatement. Sinon, la transaction est d’abord en attente puis confirmée automatiquement après 10 secondes.",
    }),
    ApiBody({ type: CreatePubliciteDto }),
    ApiResponse({
      status: 201,
      description: 'Publicité créée avec succès',
      schema: {
        example: {
          message: 'Publicité créée avec succès et payée immédiatement.',
          messageE: 'Advertisement created successfully and paid immediately.',
          data: {
            publiciteId: 1,
            titre: 'Campagne Avril Santé',
            description: 'Campagne de sensibilisation santé',
            packagePubliciteId: 1,
            annonceurUtilisateurId: 10,
            televerseParId: 7,
            nomAnnonceurExterne: null,
            telephoneAnnonceurExterne: null,
            emailAnnonceurExterne: null,
            cibleAudience: 'LES_DEUX',
            statut: 'ACTIVE',
            dateDebut: '2026-04-15T08:00:00.000Z',
            dateFin: '2026-04-22T08:00:00.000Z',
            montant: 25000,
            transactionId: 100,
            createdAt: '2026-04-11T10:00:00.000Z',
            updatedAt: '2026-04-11T10:00:00.000Z',
            packagePublicite: {
              packagePubliciteId: 1,
              nom: 'Pack Mixte 7 jours',
              dureeJours: 7,
              montant: 25000,
            },
            medias: [
              {
                mediaPubliciteId: 1,
                typeMedia: 'IMAGE',
                urlFichier: 'https://cloudinary.com/.../image1.png',
                dureeSecondes: null,
                ordreAffichage: 0,
              },
              {
                mediaPubliciteId: 2,
                typeMedia: 'VIDEO',
                urlFichier: 'https://cloudinary.com/.../video1.mp4',
                dureeSecondes: 30,
                ordreAffichage: 1,
              },
            ],
            transaction: {
              transactionId: 100,
              paymentId: 'TR-PUB-ADMIN-xxx',
              status: 'PAID',
              amount: 25000,
              type: 'PUBLICITE',
            },
          },
        },
      },
    }),
    ApiResponse({ status: 400, description: 'Données invalides' }),
    ApiResponse({ status: 404, description: 'Package ou utilisateur introuvable' }),
  );
}

// 6. GET ALL PUBLICITES ADMIN
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
      schema: {
        example: {
          message: 'Liste complète des publicités récupérée avec succès',
          messageE: 'Full advertisements list retrieved successfully',
          data: [
            {
              publiciteId: 1,
              titre: 'Campagne Avril Santé',
              statut: 'ACTIVE',
              cibleAudience: 'LES_DEUX',
              dateDebut: '2026-04-15T08:00:00.000Z',
              dateFin: '2026-04-22T08:00:00.000Z',
              montant: 25000,
              packagePublicite: {
                nom: 'Pack Mixte 7 jours',
              },
              televersePar: {
                firstName: 'John',
                lastName: 'Doe',
              },
              annonceurUtilisateur: {
                firstName: 'Paul',
                lastName: 'Meka',
              },
            },
          ],
          meta: {
            total: 25,
            page: 1,
            limit: 20,
            pageCount: 2,
          },
        },
      },
    }),
  );
}

// 7. GET ALL PUBLICITES VISIBLES (Frontend)
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
      schema: {
        example: {
          message: 'Liste des publicités visibles récupérée avec succès',
          messageE: 'Visible advertisements retrieved successfully',
          data: [
            {
              publiciteId: 1,
              titre: 'Campagne Avril Santé',
              description: 'Campagne de sensibilisation santé',
              cibleAudience: 'LES_DEUX',
              dateDebut: '2026-04-15T08:00:00.000Z',
              dateFin: '2026-04-22T08:00:00.000Z',
              packagePublicite: {
                nom: 'Pack Mixte 7 jours',
              },
              annonceurUtilisateur: {
                firstName: 'Paul',
                lastName: 'Meka',
              },
              medias: [
                {
                  typeMedia: 'IMAGE',
                  urlFichier: 'https://cloudinary.com/.../image1.png',
                },
                {
                  typeMedia: 'VIDEO',
                  urlFichier: 'https://cloudinary.com/.../video1.mp4',
                  dureeSecondes: 30,
                },
              ],
            },
          ],
          meta: {
            total: 5,
            page: 1,
            limit: 20,
            pageCount: 1,
          },
        },
      },
    }),
  );
}

// 8. GET PUBLICITE BY ID
export function ApiGetPubliciteById() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Voir une publicité (ACTEUR: FRONTEND / ADMIN / TÉLÉVERSEUR)',
      description:
        "Retourne le détail complet d’une publicité avec ses médias, son annonceur, son téléverseur, sa transaction, sa dateDebut et sa dateFin.",
    }),
    ApiParam({ name: 'id', type: Number, example: 1 }),
    ApiResponse({
      status: 200,
      description: 'Publicité récupérée avec succès',
      schema: {
        example: {
          message: 'Publicité récupérée avec succès',
          messageE: 'Advertisement retrieved successfully',
          data: {
            publiciteId: 1,
            titre: 'Campagne Avril Santé',
            description: 'Campagne de sensibilisation santé',
            packagePubliciteId: 1,
            annonceurUtilisateurId: 10,
            televerseParId: 7,
            nomAnnonceurExterne: null,
            telephoneAnnonceurExterne: null,
            emailAnnonceurExterne: null,
            cibleAudience: 'LES_DEUX',
            statut: 'ACTIVE',
            dateDebut: '2026-04-15T08:00:00.000Z',
            dateFin: '2026-04-22T08:00:00.000Z',
            montant: 25000,
            transactionId: 100,
            createdAt: '2026-04-11T10:00:00.000Z',
            updatedAt: '2026-04-11T10:00:00.000Z',
            packagePublicite: {
              packagePubliciteId: 1,
              nom: 'Pack Mixte 7 jours',
              dureeJours: 7,
              montant: 25000,
              cibleAudience: 'LES_DEUX',
              nombreMaxImages: 5,
              nombreMaxVideos: 1,
              dureeMaxVideoSecondes: 30,
            },
            annonceurUtilisateur: {
              userId: 10,
              firstName: 'Paul',
              lastName: 'Meka',
              email: 'paul@test.com',
              phone: '699001122',
            },
            televersePar: {
              userId: 7,
              firstName: 'John',
              lastName: 'Doe',
              email: 'john@test.com',
            },
            medias: [
              {
                mediaPubliciteId: 1,
                typeMedia: 'IMAGE',
                urlFichier: 'https://cloudinary.com/.../image1.png',
                dureeSecondes: null,
                ordreAffichage: 0,
              },
              {
                mediaPubliciteId: 2,
                typeMedia: 'VIDEO',
                urlFichier: 'https://cloudinary.com/.../video1.mp4',
                dureeSecondes: 30,
                ordreAffichage: 1,
              },
            ],
            transaction: {
              transactionId: 100,
              paymentId: 'TR-PUB-ADMIN-xxx',
              status: 'PAID',
              amount: 25000,
              type: 'PUBLICITE',
            },
          },
        },
      },
    }),
    ApiResponse({ status: 404, description: 'Publicité introuvable' }),
  );
}

// 9. UPDATE PUBLICITE
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
    ApiResponse({
      status: 200,
      description: 'Publicité mise à jour avec succès',
      schema: {
        example: {
          message: 'Publicité mise à jour avec succès',
          messageE: 'Advertisement updated successfully',
          data: {
            publiciteId: 1,
            titre: 'Campagne Avril Santé - Version 2',
            description: 'Campagne de sensibilisation santé actualisée',
            statut: 'ACTIVE',
            dateDebut: '2026-04-20T08:00:00.000Z',
            dateFin: '2026-04-27T08:00:00.000Z',
            updatedAt: '2026-04-11T11:00:00.000Z',
          },
        },
      },
    }),
    ApiResponse({ status: 400, description: 'Données invalides ou publicité déjà démarrée' }),
    ApiResponse({ status: 404, description: 'Publicité introuvable' }),
  );
}

// 10. CANCEL PUBLICITE
export function ApiCancelPublicite() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Annuler une publicité (ACTEUR: TÉLÉVERSEUR / ADMIN)',
      description:
        "Cette API annule une publicité. Elle est utile si la campagne ne doit plus être affichée.",
    }),
    ApiParam({ name: 'id', type: Number, example: 1 }),
    ApiResponse({
      status: 200,
      description: 'Publicité annulée avec succès',
      schema: {
        example: {
          message: 'Publicité annulée avec succès',
          messageE: 'Advertisement cancelled successfully',
        },
      },
    }),
    ApiResponse({ status: 400, description: 'Publicité non annulable' }),
    ApiResponse({ status: 404, description: 'Publicité introuvable' }),
  );
}

// 11. TERMINATE PUBLICITE
export function ApiTerminatePublicite() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Terminer une publicité (ACTEUR: TÉLÉVERSEUR / ADMIN)',
      description:
        "Cette API termine manuellement une publicité avant sa date de fin si nécessaire.",
    }),
    ApiParam({ name: 'id', type: Number, example: 1 }),
    ApiResponse({
      status: 200,
      description: 'Publicité terminée avec succès',
      schema: {
        example: {
          message: 'Publicité terminée avec succès',
          messageE: 'Advertisement terminated successfully',
          data: {
            publiciteId: 1,
            titre: 'Campagne Avril Santé',
            statut: 'TERMINEE',
            dateFin: '2026-04-15T08:00:00.000Z',
          },
        },
      },
    }),
    ApiResponse({ status: 400, description: 'Publicité déjà terminée' }),
    ApiResponse({ status: 404, description: 'Publicité introuvable' }),
  );
}