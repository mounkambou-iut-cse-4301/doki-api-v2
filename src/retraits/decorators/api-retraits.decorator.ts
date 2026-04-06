import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';

// ==================== 1. CREATE PARAMETRE RETRAIT ====================

export function ApiCreateParametreRetrait() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Créer les paramètres de retrait',
      description:
        "Permet d’enregistrer le numéro de retrait d’un utilisateur et d’initialiser la vérification OTP.",
    }),
    ApiBody({
      schema: {
        example: {
          userId: 12,
          numeroRetrait: '699001122',
        },
      },
    }),
    ApiResponse({
      status: 201,
      description: 'Paramètre de retrait créé avec succès',
      schema: {
        example: {
          message: 'Paramètre de retrait créé avec succès',
          messageE: 'Withdrawal parameter created successfully',
          data: {
            parametreRetraitId: 1,
            userId: 12,
            numeroRetrait: '699001122',
            statut: 'OTP_EN_ATTENTE',
            createdAt: '2026-04-06T12:00:00.000Z',
            updatedAt: '2026-04-06T12:00:00.000Z',
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Données invalides',
    }),
    ApiResponse({
      status: 409,
      description: 'Numéro de retrait déjà utilisé',
    }),
  );
}

// ==================== 2. VERIFY PARAMETRE OTP ====================

export function ApiVerifyParametreRetraitOtp() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Vérifier OTP du paramètre de retrait',
      description:
        "Valide l’OTP lié au paramètre de retrait et passe son statut à VERIFIE.",
    }),
    ApiParam({
      name: 'parametreId',
      type: Number,
      example: 1,
      description: 'ID du paramètre de retrait',
    }),
    ApiBody({
      schema: {
        example: {
          otp: '123456',
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: 'OTP vérifié avec succès',
      schema: {
        example: {
          message: 'OTP vérifié avec succès',
          messageE: 'OTP verified successfully',
          data: {
            parametreRetraitId: 1,
            userId: 12,
            numeroRetrait: '699001122',
            statut: 'VERIFIE',
            otpValidatedAt: '2026-04-06T12:05:00.000Z',
            verifieAt: '2026-04-06T12:05:00.000Z',
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'OTP invalide ou expiré',
    }),
    ApiResponse({
      status: 404,
      description: 'Paramètre de retrait introuvable',
    }),
  );
}

// ==================== 2 BIS. UPDATE PARAMETRE RETRAIT ====================

export function ApiUpdateParametreRetrait() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Modifier le paramètre de retrait',
      description:
        "Permet de modifier le numéro de retrait puis de relancer la vérification OTP.",
    }),
    ApiParam({
      name: 'parametreId',
      type: Number,
      example: 1,
      description: 'ID du paramètre de retrait',
    }),
    ApiBody({
      schema: {
        example: {
          numeroRetrait: '677889900',
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: 'Paramètre de retrait mis à jour avec succès',
      schema: {
        example: {
          message: 'Paramètre de retrait mis à jour avec succès',
          messageE: 'Withdrawal parameter updated successfully',
          data: {
            parametreRetraitId: 1,
            userId: 12,
            numeroRetrait: '677889900',
            statut: 'OTP_EN_ATTENTE',
            updatedAt: '2026-04-06T12:10:00.000Z',
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Données invalides',
    }),
    ApiResponse({
      status: 404,
      description: 'Paramètre de retrait introuvable',
    }),
    ApiResponse({
      status: 409,
      description: 'Numéro de retrait déjà utilisé',
    }),
  );
}

// ==================== 2 TER. GET PARAMETRE RETRAIT ====================

export function ApiGetParametreRetrait() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Récupérer le paramètre de retrait d’un utilisateur',
      description:
        "Retourne le paramètre de retrait lié à un utilisateur.",
    }),
    ApiParam({
      name: 'userId',
      type: Number,
      example: 12,
      description: "ID de l'utilisateur",
    }),
    ApiResponse({
      status: 200,
      description: 'Paramètre de retrait récupéré avec succès',
      schema: {
        example: {
          message: 'Paramètre de retrait récupéré avec succès',
          messageE: 'Withdrawal parameter retrieved successfully',
          data: {
            parametreRetraitId: 1,
            userId: 12,
            numeroRetrait: '699001122',
            statut: 'VERIFIE',
            createdAt: '2026-04-06T12:00:00.000Z',
            updatedAt: '2026-04-06T12:05:00.000Z',
          },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: 'Paramètre de retrait introuvable',
    }),
  );
}

// ==================== 3. GET SOLDE USER ====================

export function ApiGetSoldeUser() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: "Récupérer le solde d'un utilisateur",
      description:
        "Retourne le solde disponible d’un utilisateur avant la demande de retrait.",
    }),
    ApiParam({
      name: 'userId',
      type: Number,
      example: 12,
      description: "ID de l'utilisateur",
    }),
    ApiResponse({
      status: 200,
      description: 'Solde récupéré avec succès',
      schema: {
        example: {
          message: 'Solde récupéré avec succès',
          messageE: 'Balance retrieved successfully',
          data: {
            userId: 12,
            soldeDisponible: 85000,
            devise: 'XAF',
          },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: 'Utilisateur introuvable',
    }),
  );
}

// ==================== 4. DEMANDER RETRAIT ====================

export function ApiDemanderRetrait() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Demander un retrait',
      description:
        "Crée une demande de retrait avec statut OTP_EN_ATTENTE.",
    }),
    ApiBody({
      schema: {
        example: {
          userId: 12,
          montant: 25000,
        },
      },
    }),
    ApiResponse({
      status: 201,
      description: 'Retrait demandé avec succès',
      schema: {
        example: {
          message: 'Retrait demandé avec succès',
          messageE: 'Withdrawal requested successfully',
          data: {
            retraitId: 10,
            userId: 12,
            parametreRetraitId: 1,
            montant: 25000,
            statut: 'OTP_EN_ATTENTE',
            numeroRetraitSnapshot: '699001122',
            demandeLe: '2026-04-06T12:10:00.000Z',
            createdAt: '2026-04-06T12:10:00.000Z',
            updatedAt: '2026-04-06T12:10:00.000Z',
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Montant invalide ou paramètre non vérifié',
    }),
    ApiResponse({
      status: 404,
      description: 'Utilisateur ou paramètre introuvable',
    }),
  );
}

// ==================== 5. VERIFY RETRAIT OTP ====================

export function ApiVerifyRetraitOtp() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: "Vérifier l'OTP d’un retrait",
      description:
        "Valide l’OTP de la demande de retrait et passe le statut à PENDING.",
    }),
    ApiParam({
      name: 'retraitId',
      type: Number,
      example: 10,
      description: 'ID du retrait',
    }),
    ApiBody({
      schema: {
        example: {
          otp: '123456',
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: 'OTP du retrait vérifié avec succès',
      schema: {
        example: {
          message: 'OTP du retrait vérifié avec succès',
          messageE: 'Withdrawal OTP verified successfully',
          data: {
            retraitId: 10,
            statut: 'PENDING',
            otpValidatedAt: '2026-04-06T12:12:00.000Z',
            updatedAt: '2026-04-06T12:12:00.000Z',
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'OTP invalide ou expiré',
    }),
    ApiResponse({
      status: 404,
      description: 'Retrait introuvable',
    }),
  );
}

// ==================== 6. GET MES RETRAITS ====================

export function ApiGetMesRetraits() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Lister les retraits d’un utilisateur',
      description:
        "Retourne la liste paginée des retraits d’un utilisateur selon les filtres.",
    }),
    ApiQuery({
      name: 'userId',
      required: false,
      type: Number,
      description: "Filtrer par utilisateur",
    }),
    ApiQuery({
      name: 'statut',
      required: false,
      type: String,
      description: 'Filtrer par statut',
    }),
    ApiQuery({
      name: 'page',
      required: false,
      type: Number,
      example: 1,
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      type: Number,
      example: 20,
    }),
    ApiResponse({
      status: 200,
      description: 'Liste des retraits récupérée avec succès',
      schema: {
        example: {
          message: 'Liste des retraits récupérée avec succès',
          messageE: 'Withdrawals retrieved successfully',
          data: [
            {
              retraitId: 10,
              userId: 12,
              montant: 25000,
              statut: 'PENDING',
              numeroRetraitSnapshot: '699001122',
              demandeLe: '2026-04-06T12:10:00.000Z',
            },
          ],
          meta: {
            total: 1,
            page: 1,
            limit: 20,
            pageCount: 1,
          },
        },
      },
    }),
  );
}

// ==================== 7. GET ALL RETRAITS ADMIN ====================

export function ApiGetAllRetraitsAdmin() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Lister tous les retraits côté admin',
      description:
        "Retourne la liste paginée de toutes les demandes de retrait avec filtres admin.",
    }),
    ApiQuery({
      name: 'userId',
      required: false,
      type: Number,
      description: 'Filtrer par utilisateur',
    }),
    ApiQuery({
      name: 'statut',
      required: false,
      type: String,
      description: 'Filtrer par statut',
    }),
    ApiQuery({
      name: 'page',
      required: false,
      type: Number,
      example: 1,
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      type: Number,
      example: 20,
    }),
    ApiResponse({
      status: 200,
      description: 'Liste admin des retraits récupérée avec succès',
      schema: {
        example: {
          message: 'Liste des retraits récupérée avec succès',
          messageE: 'Withdrawals retrieved successfully',
          data: [
            {
              retraitId: 10,
              userId: 12,
              montant: 25000,
              statut: 'PENDING',
              numeroRetraitSnapshot: '699001122',
              demandeLe: '2026-04-06T12:10:00.000Z',
              user: {
                userId: 12,
                firstName: 'Paul',
                lastName: 'Meka',
                email: 'paul@test.com',
                phone: '699001122',
              },
            },
          ],
          meta: {
            total: 1,
            page: 1,
            limit: 20,
            pageCount: 1,
          },
        },
      },
    }),
  );
}

// ==================== 8. COMPLETE RETRAIT ====================

export function ApiCompleteRetrait() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Compléter un retrait côté admin',
      description:
        "Permet à l’administrateur de finaliser un retrait en COMPLETED.",
    }),
    ApiParam({
      name: 'retraitId',
      type: Number,
      example: 10,
      description: 'ID du retrait',
    }),
    ApiBody({
      schema: {
        example: {
          referenceTraitementAdmin: 'TRX-2026-0001',
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: 'Retrait complété avec succès',
      schema: {
        example: {
          message: 'Retrait traité avec succès',
          messageE: 'Withdrawal completed successfully',
          data: {
            retraitId: 10,
            statut: 'COMPLETED',
            referenceTraitementAdmin: 'TRX-2026-0001',
            completeLe: '2026-04-06T13:00:00.000Z',
            completeParAdminId: 1,
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Retrait non traitable',
    }),
    ApiResponse({
      status: 404,
      description: 'Retrait introuvable',
    }),
  );
}

// ==================== 9. CANCEL RETRAIT ====================

export function ApiCancelRetrait() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Annuler un retrait',
      description:
        "Permet d’annuler une demande de retrait.",
    }),
    ApiParam({
      name: 'retraitId',
      type: Number,
      example: 10,
      description: 'ID du retrait',
    }),
    ApiBody({
      schema: {
        example: {
          motifAnnulation: 'Erreur sur le montant',
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: 'Retrait annulé avec succès',
      schema: {
        example: {
          message: 'Retrait annulé avec succès',
          messageE: 'Withdrawal cancelled successfully',
          data: {
            retraitId: 10,
            statut: 'CANCELLED',
            motifAnnulation: 'Erreur sur le montant',
            annuleLe: '2026-04-06T12:20:00.000Z',
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Retrait non annulable',
    }),
    ApiResponse({
      status: 404,
      description: 'Retrait introuvable',
    }),
  );
}