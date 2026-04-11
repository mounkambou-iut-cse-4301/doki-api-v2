// import { applyDecorators } from '@nestjs/common';
// import {
//   ApiBearerAuth,
//   ApiBody,
//   ApiOperation,
//   ApiParam,
//   ApiQuery,
//   ApiResponse,
// } from '@nestjs/swagger';

// // ==================== 1. CREATE PARAMETRE RETRAIT ====================

// export function ApiCreateParametreRetrait() {
//   return applyDecorators(
//     ApiBearerAuth('JWT-auth'),
//     ApiOperation({
//       summary: 'Créer les paramètres de retrait',
//       description:
//         "Permet d’enregistrer le numéro de retrait d’un utilisateur et d’initialiser la vérification OTP.",
//     }),
//     ApiBody({
//       schema: {
//         example: {
//           userId: 12,
//           numeroRetrait: '699001122',
//         },
//       },
//     }),
//     ApiResponse({
//       status: 201,
//       description: 'Paramètre de retrait créé avec succès',
//       schema: {
//         example: {
//           message: 'Paramètre de retrait créé avec succès',
//           messageE: 'Withdrawal parameter created successfully',
//           data: {
//             parametreRetraitId: 1,
//             userId: 12,
//             numeroRetrait: '699001122',
//             statut: 'OTP_EN_ATTENTE',
//             createdAt: '2026-04-06T12:00:00.000Z',
//             updatedAt: '2026-04-06T12:00:00.000Z',
//           },
//         },
//       },
//     }),
//     ApiResponse({
//       status: 400,
//       description: 'Données invalides',
//     }),
//     ApiResponse({
//       status: 409,
//       description: 'Numéro de retrait déjà utilisé',
//     }),
//   );
// }

// // ==================== 2. VERIFY PARAMETRE OTP ====================

// export function ApiVerifyParametreRetraitOtp() {
//   return applyDecorators(
//     ApiBearerAuth('JWT-auth'),
//     ApiOperation({
//       summary: 'Vérifier OTP du paramètre de retrait',
//       description:
//         "Valide l’OTP lié au paramètre de retrait et passe son statut à VERIFIE.",
//     }),
//     ApiParam({
//       name: 'parametreId',
//       type: Number,
//       example: 1,
//       description: 'ID du paramètre de retrait',
//     }),
//     ApiBody({
//       schema: {
//         example: {
//           otp: '123456',
//         },
//       },
//     }),
//     ApiResponse({
//       status: 200,
//       description: 'OTP vérifié avec succès',
//       schema: {
//         example: {
//           message: 'OTP vérifié avec succès',
//           messageE: 'OTP verified successfully',
//           data: {
//             parametreRetraitId: 1,
//             userId: 12,
//             numeroRetrait: '699001122',
//             statut: 'VERIFIE',
//             otpValidatedAt: '2026-04-06T12:05:00.000Z',
//             verifieAt: '2026-04-06T12:05:00.000Z',
//           },
//         },
//       },
//     }),
//     ApiResponse({
//       status: 400,
//       description: 'OTP invalide ou expiré',
//     }),
//     ApiResponse({
//       status: 404,
//       description: 'Paramètre de retrait introuvable',
//     }),
//   );
// }

// // ==================== 2 BIS. UPDATE PARAMETRE RETRAIT ====================

// export function ApiUpdateParametreRetrait() {
//   return applyDecorators(
//     ApiBearerAuth('JWT-auth'),
//     ApiOperation({
//       summary: 'Modifier le paramètre de retrait',
//       description:
//         "Permet de modifier le numéro de retrait puis de relancer la vérification OTP.",
//     }),
//     ApiParam({
//       name: 'parametreId',
//       type: Number,
//       example: 1,
//       description: 'ID du paramètre de retrait',
//     }),
//     ApiBody({
//       schema: {
//         example: {
//           numeroRetrait: '677889900',
//         },
//       },
//     }),
//     ApiResponse({
//       status: 200,
//       description: 'Paramètre de retrait mis à jour avec succès',
//       schema: {
//         example: {
//           message: 'Paramètre de retrait mis à jour avec succès',
//           messageE: 'Withdrawal parameter updated successfully',
//           data: {
//             parametreRetraitId: 1,
//             userId: 12,
//             numeroRetrait: '677889900',
//             statut: 'OTP_EN_ATTENTE',
//             updatedAt: '2026-04-06T12:10:00.000Z',
//           },
//         },
//       },
//     }),
//     ApiResponse({
//       status: 400,
//       description: 'Données invalides',
//     }),
//     ApiResponse({
//       status: 404,
//       description: 'Paramètre de retrait introuvable',
//     }),
//     ApiResponse({
//       status: 409,
//       description: 'Numéro de retrait déjà utilisé',
//     }),
//   );
// }

// // ==================== 2 TER. GET PARAMETRE RETRAIT ====================

// export function ApiGetParametreRetrait() {
//   return applyDecorators(
//     ApiBearerAuth('JWT-auth'),
//     ApiOperation({
//       summary: 'Récupérer le paramètre de retrait d’un utilisateur',
//       description:
//         "Retourne le paramètre de retrait lié à un utilisateur.",
//     }),
//     ApiParam({
//       name: 'userId',
//       type: Number,
//       example: 12,
//       description: "ID de l'utilisateur",
//     }),
//     ApiResponse({
//       status: 200,
//       description: 'Paramètre de retrait récupéré avec succès',
//       schema: {
//         example: {
//           message: 'Paramètre de retrait récupéré avec succès',
//           messageE: 'Withdrawal parameter retrieved successfully',
//           data: {
//             parametreRetraitId: 1,
//             userId: 12,
//             numeroRetrait: '699001122',
//             statut: 'VERIFIE',
//             createdAt: '2026-04-06T12:00:00.000Z',
//             updatedAt: '2026-04-06T12:05:00.000Z',
//           },
//         },
//       },
//     }),
//     ApiResponse({
//       status: 404,
//       description: 'Paramètre de retrait introuvable',
//     }),
//   );
// }

// // ==================== 3. GET SOLDE USER ====================

// export function ApiGetSoldeUser() {
//   return applyDecorators(
//     ApiBearerAuth('JWT-auth'),
//     ApiOperation({
//       summary: "Récupérer le solde d'un utilisateur",
//       description:
//         "Retourne le solde disponible d’un utilisateur avant la demande de retrait.",
//     }),
//     ApiParam({
//       name: 'userId',
//       type: Number,
//       example: 12,
//       description: "ID de l'utilisateur",
//     }),
//     ApiResponse({
//       status: 200,
//       description: 'Solde récupéré avec succès',
//       schema: {
//         example: {
//           message: 'Solde récupéré avec succès',
//           messageE: 'Balance retrieved successfully',
//           data: {
//             userId: 12,
//             soldeDisponible: 85000,
//             devise: 'XAF',
//           },
//         },
//       },
//     }),
//     ApiResponse({
//       status: 404,
//       description: 'Utilisateur introuvable',
//     }),
//   );
// }

// // ==================== 4. DEMANDER RETRAIT ====================

// export function ApiDemanderRetrait() {
//   return applyDecorators(
//     ApiBearerAuth('JWT-auth'),
//     ApiOperation({
//       summary: 'Demander un retrait',
//       description:
//         "Crée une demande de retrait avec statut OTP_EN_ATTENTE.",
//     }),
//     ApiBody({
//       schema: {
//         example: {
//           userId: 12,
//           montant: 25000,
//         },
//       },
//     }),
//     ApiResponse({
//       status: 201,
//       description: 'Retrait demandé avec succès',
//       schema: {
//         example: {
//           message: 'Retrait demandé avec succès',
//           messageE: 'Withdrawal requested successfully',
//           data: {
//             retraitId: 10,
//             userId: 12,
//             parametreRetraitId: 1,
//             montant: 25000,
//             statut: 'OTP_EN_ATTENTE',
//             numeroRetraitSnapshot: '699001122',
//             demandeLe: '2026-04-06T12:10:00.000Z',
//             createdAt: '2026-04-06T12:10:00.000Z',
//             updatedAt: '2026-04-06T12:10:00.000Z',
//           },
//         },
//       },
//     }),
//     ApiResponse({
//       status: 400,
//       description: 'Montant invalide ou paramètre non vérifié',
//     }),
//     ApiResponse({
//       status: 404,
//       description: 'Utilisateur ou paramètre introuvable',
//     }),
//   );
// }

// // ==================== 5. VERIFY RETRAIT OTP ====================

// export function ApiVerifyRetraitOtp() {
//   return applyDecorators(
//     ApiBearerAuth('JWT-auth'),
//     ApiOperation({
//       summary: "Vérifier l'OTP d’un retrait",
//       description:
//         "Valide l’OTP de la demande de retrait et passe le statut à PENDING.",
//     }),
//     ApiParam({
//       name: 'retraitId',
//       type: Number,
//       example: 10,
//       description: 'ID du retrait',
//     }),
//     ApiBody({
//       schema: {
//         example: {
//           otp: '123456',
//         },
//       },
//     }),
//     ApiResponse({
//       status: 200,
//       description: 'OTP du retrait vérifié avec succès',
//       schema: {
//         example: {
//           message: 'OTP du retrait vérifié avec succès',
//           messageE: 'Withdrawal OTP verified successfully',
//           data: {
//             retraitId: 10,
//             statut: 'PENDING',
//             otpValidatedAt: '2026-04-06T12:12:00.000Z',
//             updatedAt: '2026-04-06T12:12:00.000Z',
//           },
//         },
//       },
//     }),
//     ApiResponse({
//       status: 400,
//       description: 'OTP invalide ou expiré',
//     }),
//     ApiResponse({
//       status: 404,
//       description: 'Retrait introuvable',
//     }),
//   );
// }

// // ==================== 6. GET MES RETRAITS ====================

// export function ApiGetMesRetraits() {
//   return applyDecorators(
//     ApiBearerAuth('JWT-auth'),
//     ApiOperation({
//       summary: 'Lister les retraits d’un utilisateur',
//       description:
//         "Retourne la liste paginée des retraits d’un utilisateur selon les filtres.",
//     }),
//     ApiQuery({
//       name: 'userId',
//       required: false,
//       type: Number,
//       description: "Filtrer par utilisateur",
//     }),
//     ApiQuery({
//       name: 'statut',
//       required: false,
//       type: String,
//       description: 'Filtrer par statut',
//     }),
//     ApiQuery({
//       name: 'page',
//       required: false,
//       type: Number,
//       example: 1,
//     }),
//     ApiQuery({
//       name: 'limit',
//       required: false,
//       type: Number,
//       example: 20,
//     }),
//     ApiResponse({
//       status: 200,
//       description: 'Liste des retraits récupérée avec succès',
//       schema: {
//         example: {
//           message: 'Liste des retraits récupérée avec succès',
//           messageE: 'Withdrawals retrieved successfully',
//           data: [
//             {
//               retraitId: 10,
//               userId: 12,
//               montant: 25000,
//               statut: 'PENDING',
//               numeroRetraitSnapshot: '699001122',
//               demandeLe: '2026-04-06T12:10:00.000Z',
//             },
//           ],
//           meta: {
//             total: 1,
//             page: 1,
//             limit: 20,
//             pageCount: 1,
//           },
//         },
//       },
//     }),
//   );
// }

// // ==================== 7. GET ALL RETRAITS ADMIN ====================

// export function ApiGetAllRetraitsAdmin() {
//   return applyDecorators(
//     ApiBearerAuth('JWT-auth'),
//     ApiOperation({
//       summary: 'Lister tous les retraits côté admin',
//       description:
//         "Retourne la liste paginée de toutes les demandes de retrait avec filtres admin.",
//     }),
//     ApiQuery({
//       name: 'userId',
//       required: false,
//       type: Number,
//       description: 'Filtrer par utilisateur',
//     }),
//     ApiQuery({
//       name: 'statut',
//       required: false,
//       type: String,
//       description: 'Filtrer par statut',
//     }),
//     ApiQuery({
//       name: 'page',
//       required: false,
//       type: Number,
//       example: 1,
//     }),
//     ApiQuery({
//       name: 'limit',
//       required: false,
//       type: Number,
//       example: 20,
//     }),
//     ApiResponse({
//       status: 200,
//       description: 'Liste admin des retraits récupérée avec succès',
//       schema: {
//         example: {
//           message: 'Liste des retraits récupérée avec succès',
//           messageE: 'Withdrawals retrieved successfully',
//           data: [
//             {
//               retraitId: 10,
//               userId: 12,
//               montant: 25000,
//               statut: 'PENDING',
//               numeroRetraitSnapshot: '699001122',
//               demandeLe: '2026-04-06T12:10:00.000Z',
//               user: {
//                 userId: 12,
//                 firstName: 'Paul',
//                 lastName: 'Meka',
//                 email: 'paul@test.com',
//                 phone: '699001122',
//               },
//             },
//           ],
//           meta: {
//             total: 1,
//             page: 1,
//             limit: 20,
//             pageCount: 1,
//           },
//         },
//       },
//     }),
//   );
// }

// // ==================== 8. COMPLETE RETRAIT ====================

// export function ApiCompleteRetrait() {
//   return applyDecorators(
//     ApiBearerAuth('JWT-auth'),
//     ApiOperation({
//       summary: 'Compléter un retrait côté admin',
//       description:
//         "Permet à l’administrateur de finaliser un retrait en COMPLETED.",
//     }),
//     ApiParam({
//       name: 'retraitId',
//       type: Number,
//       example: 10,
//       description: 'ID du retrait',
//     }),
//     ApiBody({
//       schema: {
//         example: {
//           referenceTraitementAdmin: 'TRX-2026-0001',
//         },
//       },
//     }),
//     ApiResponse({
//       status: 200,
//       description: 'Retrait complété avec succès',
//       schema: {
//         example: {
//           message: 'Retrait traité avec succès',
//           messageE: 'Withdrawal completed successfully',
//           data: {
//             retraitId: 10,
//             statut: 'COMPLETED',
//             referenceTraitementAdmin: 'TRX-2026-0001',
//             completeLe: '2026-04-06T13:00:00.000Z',
//             completeParAdminId: 1,
//           },
//         },
//       },
//     }),
//     ApiResponse({
//       status: 400,
//       description: 'Retrait non traitable',
//     }),
//     ApiResponse({
//       status: 404,
//       description: 'Retrait introuvable',
//     }),
//   );
// }

// // ==================== 9. CANCEL RETRAIT ====================

// export function ApiCancelRetrait() {
//   return applyDecorators(
//     ApiBearerAuth('JWT-auth'),
//     ApiOperation({
//       summary: 'Annuler un retrait',
//       description:
//         "Permet d’annuler une demande de retrait.",
//     }),
//     ApiParam({
//       name: 'retraitId',
//       type: Number,
//       example: 10,
//       description: 'ID du retrait',
//     }),
//     ApiBody({
//       schema: {
//         example: {
//           motifAnnulation: 'Erreur sur le montant',
//         },
//       },
//     }),
//     ApiResponse({
//       status: 200,
//       description: 'Retrait annulé avec succès',
//       schema: {
//         example: {
//           message: 'Retrait annulé avec succès',
//           messageE: 'Withdrawal cancelled successfully',
//           data: {
//             retraitId: 10,
//             statut: 'CANCELLED',
//             motifAnnulation: 'Erreur sur le montant',
//             annuleLe: '2026-04-06T12:20:00.000Z',
//           },
//         },
//       },
//     }),
//     ApiResponse({
//       status: 400,
//       description: 'Retrait non annulable',
//     }),
//     ApiResponse({
//       status: 404,
//       description: 'Retrait introuvable',
//     }),
//   );
// }

import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';

// ==================== PARAMÈTRES DE RETRAIT ====================

// 1. CREATE PARAMETRE RETRAIT
export function ApiCreateParametreRetrait() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Créer les paramètres de retrait (ACTEUR: MÉDECIN / HÔPITAL)',
      description:
        "Permet à un médecin ou un hôpital d'enregistrer son numéro de retrait (Mobile Money) et d'initialiser la vérification OTP. Le numéro sera utilisé pour recevoir les paiements des retraits. Un OTP est envoyé par SMS pour vérifier le numéro.",
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
    ApiResponse({ status: 400, description: 'Données invalides' }),
    ApiResponse({ status: 401, description: 'Non authentifié' }),
    ApiResponse({ status: 403, description: 'Accès interdit - Seuls les médecins et hôpitaux peuvent créer un paramètre de retrait' }),
    ApiResponse({ status: 409, description: 'Numéro de retrait déjà utilisé' }),
  );
}

// 2. VERIFY PARAMETRE RETRAIT OTP
export function ApiVerifyParametreRetraitOtp() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Vérifier OTP du paramètre de retrait (ACTEUR: MÉDECIN / HÔPITAL)',
      description:
        "Valide l'OTP reçu par SMS pour confirmer le numéro de retrait. Après validation, le statut passe à VERIFIE et le numéro peut être utilisé pour les demandes de retrait. L'OTP expire après 10 minutes.",
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
    ApiResponse({ status: 400, description: 'OTP invalide ou expiré' }),
    ApiResponse({ status: 401, description: 'Non authentifié' }),
    ApiResponse({ status: 403, description: 'Accès interdit - Vous ne pouvez vérifier que vos propres paramètres' }),
    ApiResponse({ status: 404, description: 'Paramètre de retrait introuvable' }),
  );
}

// 3. UPDATE PARAMETRE RETRAIT
export function ApiUpdateParametreRetrait() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Modifier le paramètre de retrait (ACTEUR: MÉDECIN / HÔPITAL)',
      description:
        "Permet à un médecin ou un hôpital de modifier son numéro de retrait. Après modification, le statut repasse à OTP_EN_ATTENTE et une nouvelle vérification OTP est requise. L'ancien numéro est remplacé.",
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
    ApiResponse({ status: 400, description: 'Données invalides' }),
    ApiResponse({ status: 401, description: 'Non authentifié' }),
    ApiResponse({ status: 403, description: 'Accès interdit - Vous ne pouvez modifier que vos propres paramètres' }),
    ApiResponse({ status: 404, description: 'Paramètre de retrait introuvable' }),
    ApiResponse({ status: 409, description: 'Numéro de retrait déjà utilisé' }),
  );
}

// 4. GET PARAMETRE RETRAIT
export function ApiGetParametreRetrait() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Récupérer le paramètre de retrait (ACTEUR: MÉDECIN / HÔPITAL / ADMIN)',
      description:
        "Retourne le paramètre de retrait (numéro et statut de vérification) d'un médecin ou d'un hôpital. Les médecins et hôpitaux ne peuvent voir que leurs propres paramètres. Les administrateurs peuvent voir ceux de tous les utilisateurs.",
    }),
    ApiParam({
      name: 'userId',
      type: Number,
      example: 12,
      description: "ID de l'utilisateur (médecin ou hôpital)",
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
    ApiResponse({ status: 401, description: 'Non authentifié' }),
    ApiResponse({ status: 403, description: 'Accès interdit - Vous ne pouvez voir que vos propres paramètres (sauf admin)' }),
    ApiResponse({ status: 404, description: 'Paramètre de retrait introuvable' }),
  );
}

// ==================== SOLDE ====================

// 5. GET SOLDE USER
export function ApiGetSoldeUser() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: "Récupérer le solde d'un utilisateur (ACTEUR: MÉDECIN / HÔPITAL / ADMIN)",
      description:
        "Retourne le solde disponible d'un médecin ou d'un hôpital avant de faire une demande de retrait. Le solde correspond aux gains générés par les consultations (en ligne et en présentiel) après déduction des commissions plateforme. Les médecins et hôpitaux ne peuvent voir que leur propre solde. Les administrateurs peuvent voir celui de tous les utilisateurs.",
    }),
    ApiParam({
      name: 'userId',
      type: Number,
      example: 12,
      description: "ID de l'utilisateur (médecin ou hôpital)",
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
            userType: 'MEDECIN',
          },
        },
      },
    }),
    ApiResponse({ status: 401, description: 'Non authentifié' }),
    ApiResponse({ status: 403, description: 'Accès interdit - Vous ne pouvez voir que votre propre solde (sauf admin)' }),
    ApiResponse({ status: 404, description: 'Utilisateur introuvable' }),
  );
}

// ==================== DEMANDES DE RETRAIT ====================

// 6. DEMANDER RETRAIT
export function ApiDemanderRetrait() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Demander un retrait (ACTEUR: MÉDECIN / HÔPITAL)',
      description:
        "Permet à un médecin ou un hôpital de faire une demande de retrait de ses gains. Conditions : avoir un paramètre de retrait vérifié (statut VERIFIE) et un solde suffisant. La demande est créée avec le statut OTP_EN_ATTENTE. Un OTP est envoyé par SMS. Après validation OTP, la demande passe en PENDING et sera traitée par l'administrateur.",
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
          message: 'Retrait demandé avec succès. Un OTP a été envoyé pour validation.',
          messageE: 'Withdrawal requested successfully. An OTP has been sent for validation.',
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
    ApiResponse({ status: 400, description: 'Montant invalide, solde insuffisant ou paramètre non vérifié' }),
    ApiResponse({ status: 401, description: 'Non authentifié' }),
    ApiResponse({ status: 403, description: 'Accès interdit - Seuls les médecins et hôpitaux peuvent demander un retrait' }),
    ApiResponse({ status: 404, description: 'Utilisateur ou paramètre de retrait introuvable' }),
  );
}

// 7. VERIFY RETRAIT OTP
export function ApiVerifyRetraitOtp() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: "Vérifier l'OTP d'un retrait (ACTEUR: MÉDECIN / HÔPITAL)",
      description:
        "Valide l'OTP reçu par SMS pour confirmer la demande de retrait. Après validation, la demande passe du statut OTP_EN_ATTENTE à PENDING, prête à être traitée par l'administrateur. L'OTP expire après 10 minutes.",
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
          message: 'OTP du retrait vérifié avec succès. La demande est maintenant en attente de traitement par un administrateur.',
          messageE: 'Withdrawal OTP verified successfully. The request is now pending admin processing.',
          data: {
            retraitId: 10,
            statut: 'PENDING',
            otpValidatedAt: '2026-04-06T12:12:00.000Z',
            updatedAt: '2026-04-06T12:12:00.000Z',
          },
        },
      },
    }),
    ApiResponse({ status: 400, description: 'OTP invalide ou expiré' }),
    ApiResponse({ status: 401, description: 'Non authentifié' }),
    ApiResponse({ status: 403, description: 'Accès interdit - Vous ne pouvez vérifier que vos propres demandes de retrait' }),
    ApiResponse({ status: 404, description: 'Retrait introuvable' }),
  );
}

// 8. GET MES RETRAITS
export function ApiGetMesRetraits() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Lister mes retraits (ACTEUR: MÉDECIN / HÔPITAL)',
      description:
        "Retourne la liste paginée des demandes de retrait de l'utilisateur authentifié (médecin ou hôpital). Permet de filtrer par statut (OTP_EN_ATTENTE, PENDING, COMPLETED, CANCELLED).",
    }),
    ApiQuery({
      name: 'statut',
      required: false,
      type: String,
      description: 'Filtrer par statut : OTP_EN_ATTENTE, PENDING, COMPLETED, CANCELLED',
      enum: ['OTP_EN_ATTENTE', 'PENDING', 'COMPLETED', 'CANCELLED'],
    }),
    ApiQuery({
      name: 'page',
      required: false,
      type: Number,
      example: 1,
      default: 1,
      description: 'Numéro de page',
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      type: Number,
      example: 20,
      default: 20,
      description: 'Nombre d\'éléments par page',
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
            {
              retraitId: 11,
              userId: 12,
              montant: 15000,
              statut: 'COMPLETED',
              numeroRetraitSnapshot: '699001122',
              demandeLe: '2026-04-01T10:00:00.000Z',
              completeLe: '2026-04-02T14:30:00.000Z',
            },
          ],
          meta: {
            total: 2,
            page: 1,
            limit: 20,
            pageCount: 1,
          },
        },
      },
    }),
    ApiResponse({ status: 401, description: 'Non authentifié' }),
  );
}

// 9. GET ALL RETRAITS ADMIN
export function ApiGetAllRetraitsAdmin() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Lister toutes les demandes de retrait (ACTEUR: ADMIN / SUPERADMIN)',
      description:
        "Retourne la liste paginée de toutes les demandes de retrait avec filtres avancés pour l'administration. Permet de filtrer par utilisateur (médecin/hôpital), statut, et plage de dates. Les administrateurs peuvent voir les informations détaillées de chaque demandeur.",
    }),
    ApiQuery({
      name: 'userId',
      required: false,
      type: Number,
      description: 'Filtrer par ID utilisateur (médecin ou hôpital)',
    }),
    ApiQuery({
      name: 'statut',
      required: false,
      type: String,
      description: 'Filtrer par statut : OTP_EN_ATTENTE, PENDING, COMPLETED, CANCELLED',
      enum: ['OTP_EN_ATTENTE', 'PENDING', 'COMPLETED', 'CANCELLED'],
    }),
    ApiQuery({
      name: 'dateDebutMin',
      required: false,
      type: String,
      description: 'Date de début minimum (YYYY-MM-DD)',
    }),
    ApiQuery({
      name: 'dateDebutMax',
      required: false,
      type: String,
      description: 'Date de début maximum (YYYY-MM-DD)',
    }),
    ApiQuery({
      name: 'page',
      required: false,
      type: Number,
      example: 1,
      default: 1,
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      type: Number,
      example: 20,
      default: 20,
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
                userType: 'MEDECIN',
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
    ApiResponse({ status: 401, description: 'Non authentifié' }),
    ApiResponse({ status: 403, description: 'Accès interdit - Réservé aux administrateurs' }),
  );
}

// 10. COMPLETE RETRAIT (ADMIN)
export function ApiCompleteRetrait() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Valider et compléter un retrait (ACTEUR: ADMIN / SUPERADMIN)',
      description:
        "Permet à l'administrateur de finaliser une demande de retrait avec le statut PENDING. Le retrait passe à COMPLETED. L'administrateur doit fournir une référence de traitement (ex: numéro de transaction Mobile Money). Une fois complété, le montant est déduit définitivement du solde de l'utilisateur.",
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
    ApiResponse({ status: 400, description: 'Retrait non traitable (déjà complété ou annulé, ou pas encore en PENDING)' }),
    ApiResponse({ status: 401, description: 'Non authentifié' }),
    ApiResponse({ status: 403, description: 'Accès interdit - Réservé aux administrateurs' }),
    ApiResponse({ status: 404, description: 'Retrait introuvable' }),
  );
}

// 11. CANCEL RETRAIT (USER ou ADMIN)
export function ApiCancelRetrait() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Annuler une demande de retrait (ACTEUR: MÉDECIN / HÔPITAL / ADMIN)',
      description:
        "Permet d'annuler une demande de retrait avant qu'elle ne soit complétée. Un médecin/hôpital peut annuler ses propres demandes si elles sont encore en OTP_EN_ATTENTE ou PENDING. Un administrateur peut annuler n'importe quelle demande non encore complétée. Un motif d'annulation est requis.",
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
    ApiResponse({ status: 400, description: 'Retrait non annulable (déjà complété ou déjà annulé)' }),
    ApiResponse({ status: 401, description: 'Non authentifié' }),
    ApiResponse({ status: 403, description: 'Accès interdit - Vous ne pouvez annuler que vos propres retraits (sauf admin)' }),
    ApiResponse({ status: 404, description: 'Retrait introuvable' }),
  );
}

// 12. GET RETRAIT BY ID
export function ApiGetRetraitById() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: "Voir les détails d'un retrait (ACTEUR: MÉDECIN / HÔPITAL / ADMIN)",
      description:
        "Retourne le détail complet d'une demande de retrait, y compris les informations de l'utilisateur, du paramètre de retrait, et les dates de traitement. Les médecins et hôpitaux ne peuvent voir que leurs propres retraits. Les administrateurs peuvent voir tous les retraits.",
    }),
    ApiParam({
      name: 'id',
      type: Number,
      example: 10,
      description: 'ID du retrait',
    }),
    ApiResponse({
      status: 200,
      description: 'Retrait récupéré avec succès',
      schema: {
        example: {
          message: 'Retrait récupéré avec succès',
          messageE: 'Withdrawal retrieved successfully',
          data: {
            retraitId: 10,
            userId: 12,
            montant: 25000,
            statut: 'COMPLETED',
            numeroRetraitSnapshot: '699001122',
            demandeLe: '2026-04-06T12:10:00.000Z',
            completeLe: '2026-04-06T13:00:00.000Z',
            referenceTraitementAdmin: 'TRX-2026-0001',
            motifAnnulation: null,
            user: {
              userId: 12,
              firstName: 'Paul',
              lastName: 'Meka',
              email: 'paul@test.com',
              phone: '699001122',
              userType: 'MEDECIN',
            },
            parametreRetrait: {
              parametreRetraitId: 1,
              numeroRetrait: '699001122',
              statut: 'VERIFIE',
            },
          },
        },
      },
    }),
    ApiResponse({ status: 401, description: 'Non authentifié' }),
    ApiResponse({ status: 403, description: 'Accès interdit - Vous ne pouvez voir que vos propres retraits (sauf admin)' }),
    ApiResponse({ status: 404, description: 'Retrait introuvable' }),
  );
}