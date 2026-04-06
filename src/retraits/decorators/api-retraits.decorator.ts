import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { CreateParametreRetraitDto } from '../dto/create-parametre-retrait.dto';
import { UpdateParametreRetraitDto } from '../dto/update-parametre-retrait.dto';
import { VerifyParametreRetraitOtpDto } from '../dto/verify-parametre-retrait-otp.dto';
import { DemanderRetraitDto } from '../dto/demander-retrait.dto';
import { VerifyRetraitOtpDto } from '../dto/verify-retrait-otp.dto';
import { CompleteRetraitDto } from '../dto/complete-retrait.dto';
import { CancelRetraitDto } from '../dto/cancel-retrait.dto';

export function ApiCreateParametreRetrait() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary:
        'Étape 1/9 - Paramétrer le numéro de retrait (ACTEUR: MEDECIN ou HOPITAL)',
      description:
        "Le médecin ou l’hôpital enregistre son numéro de retrait. " +
        "Le système génère ensuite un OTP à 6 chiffres et l’envoie par email. " +
        "Le numéro reste inutilisable tant que l’OTP n’est pas validé.",
    }),
    ApiBody({ type: CreateParametreRetraitDto }),
    ApiResponse({
      status: 201,
      description: 'OTP envoyé pour validation du numéro de retrait',
    }),
  );
}

export function ApiVerifyParametreRetraitOtp() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary:
        'Étape 2/9 - Vérifier le numéro de retrait par OTP (ACTEUR: MEDECIN ou HOPITAL)',
      description:
        "Le médecin ou l’hôpital saisit ici le code OTP reçu par email. " +
        "Si le code est correct et non expiré, le numéro de retrait passe au statut VERIFIE.",
    }),
    ApiParam({ name: 'parametreId', type: Number, example: 1 }),
    ApiBody({ type: VerifyParametreRetraitOtpDto }),
    ApiResponse({
      status: 200,
      description: 'Numéro de retrait vérifié avec succès',
    }),
  );
}

export function ApiUpdateParametreRetrait() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary:
        'Étape 2 bis/9 - Modifier puis revalider le numéro de retrait (ACTEUR: MEDECIN ou HOPITAL)',
      description:
        "Si l’utilisateur change son numéro de retrait, un nouvel OTP est renvoyé par email. " +
        "Le nouveau numéro ne devient valide qu’après une nouvelle confirmation OTP.",
    }),
    ApiParam({ name: 'parametreId', type: Number, example: 1 }),
    ApiBody({ type: UpdateParametreRetraitDto }),
    ApiResponse({
      status: 200,
      description: 'OTP envoyé pour revalidation du numéro de retrait',
    }),
  );
}

export function ApiGetParametreRetrait() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary:
        'Étape 2 ter/9 - Voir le paramètre de retrait actuel (ACTEUR: MEDECIN / HOPITAL / ADMIN)',
      description:
        "Retourne le numéro de retrait enregistré, son statut de vérification et ses dates associées. " +
        "Un utilisateur ne peut posséder qu’un seul paramètre de retrait.",
    }),
    ApiParam({ name: 'userId', type: Number, example: 7 }),
    ApiResponse({
      status: 200,
      description: 'Paramètre de retrait récupéré avec succès',
    }),
  );
}

export function ApiGetSoldeUser() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary:
        "Étape 3/9 - Voir le solde disponible avant retrait (ACTEUR: MEDECIN / HOPITAL / ADMIN)",
      description:
        "Cette API lit le solde chiffré en base, le déchiffre côté serveur et retourne la valeur lisible. " +
        "Le frontend ne reçoit jamais la valeur chiffrée.",
    }),
    ApiParam({ name: 'userId', type: Number, example: 7 }),
    ApiResponse({
      status: 200,
      description: 'Solde récupéré avec succès',
    }),
  );
}

export function ApiDemanderRetrait() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary:
        'Étape 4/9 - Demander un retrait et recevoir un OTP (ACTEUR: MEDECIN ou HOPITAL)',
      description:
        "Le système vérifie d’abord que le numéro de retrait est déjà vérifié. " +
        "Ensuite il calcule le solde disponible réel en tenant compte des retraits déjà PENDING. " +
        "Si le montant est disponible, un OTP à 6 chiffres est envoyé par email et la demande est créée en OTP_EN_ATTENTE.",
    }),
    ApiBody({ type: DemanderRetraitDto }),
    ApiResponse({
      status: 201,
      description: 'OTP envoyé pour confirmer la demande de retrait',
    }),
  );
}

export function ApiVerifyRetraitOtp() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary:
        'Étape 5/9 - Vérifier l’OTP de la demande de retrait (ACTEUR: MEDECIN ou HOPITAL)',
      description:
        "L’utilisateur saisit ici le code OTP reçu par email pour sa demande de retrait. " +
        "Si le code est correct et que le solde est toujours suffisant, la demande passe au statut PENDING.",
    }),
    ApiParam({ name: 'retraitId', type: Number, example: 1 }),
    ApiBody({ type: VerifyRetraitOtpDto }),
    ApiResponse({
      status: 200,
      description: 'Retrait confirmé et mis en attente',
    }),
  );
}

export function ApiGetMesRetraits() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary:
        "Étape 6/9 - Voir l’historique de ses retraits (ACTEUR: MEDECIN ou HOPITAL)",
      description:
        "Retourne la liste des demandes de retrait d’un utilisateur, avec pagination et filtre par statut. " +
        "Le frontend peut ainsi suivre les retraits OTP_EN_ATTENTE, PENDING, COMPLETED ou CANCELLED.",
    }),
    ApiQuery({ name: 'userId', required: true, type: Number }),
    ApiQuery({ name: 'statut', required: false, type: String }),
    ApiQuery({ name: 'page', required: false, type: Number, default: 1 }),
    ApiQuery({ name: 'limit', required: false, type: Number, default: 20 }),
    ApiResponse({
      status: 200,
      description: 'Historique des retraits récupéré avec succès',
    }),
  );
}

export function ApiGetAllRetraitsAdmin() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary:
        'Étape 7/9 - Voir toutes les demandes de retrait côté admin (ACTEUR: ADMIN ou SUPERADMIN)',
      description:
        "Retourne toute l’historique des retraits, tous utilisateurs confondus, avec pagination et filtre par statut. " +
        "Cette API sert au tableau de bord admin pour voir les demandes à traiter.",
    }),
    ApiQuery({ name: 'statut', required: false, type: String }),
    ApiQuery({ name: 'page', required: false, type: Number, default: 1 }),
    ApiQuery({ name: 'limit', required: false, type: Number, default: 20 }),
    ApiResponse({
      status: 200,
      description: 'Liste complète des retraits récupérée avec succès',
    }),
  );
}

export function ApiCompleteRetrait() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary:
        'Étape 8/9 - Compléter le retrait après envoi réel de l’argent (ACTEUR: ADMIN ou SUPERADMIN)',
      description:
        "L’admin appelle cette API uniquement après avoir réellement envoyé l’argent. " +
        "Le serveur lit alors le solde chiffré, le déchiffre, soustrait le montant, rechiffre la nouvelle valeur puis met le retrait au statut COMPLETED.",
    }),
    ApiParam({ name: 'retraitId', type: Number, example: 1 }),
    ApiBody({ type: CompleteRetraitDto }),
    ApiResponse({
      status: 200,
      description: 'Retrait complété avec succès',
    }),
  );
}

export function ApiCancelRetrait() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary:
        'Étape 9/9 - Annuler une demande de retrait non finalisée (ACTEUR: PROPRIETAIRE ou ADMIN)',
      description:
        "Le propriétaire du retrait ou un admin peut annuler une demande encore OTP_EN_ATTENTE ou PENDING. " +
        "Aucun débit n’est appliqué au solde tant que le retrait n’est pas COMPLETED.",
    }),
    ApiParam({ name: 'retraitId', type: Number, example: 1 }),
    ApiBody({ type: CancelRetraitDto }),
    ApiResponse({
      status: 200,
      description: 'Retrait annulé avec succès',
    }),
  );
}