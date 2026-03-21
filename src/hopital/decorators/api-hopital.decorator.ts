import { applyDecorators } from '@nestjs/common';
import { 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody
} from '@nestjs/swagger';
import { CreateHopitalDto } from '../dto/create-hopital.dto';
import { UpdateHopitalDto } from '../dto/update-hopital.dto';
import { AddMedecinsDto, RemoveMedecinsDto } from '../dto/add-medecin.dto';

// ==================== CREATE HOPITAL ====================
export function ApiCreateHopital() {
  return applyDecorators(
    ApiOperation({ 
      summary: 'Créer un compte hôpital',
      description: 'Inscription d\'un nouvel hôpital sur la plateforme (profil accepte base64 ou URL)'
    }),
    ApiBody({ type: CreateHopitalDto }),
    ApiResponse({
      status: 201,
      description: 'Hôpital créé avec succès',
      schema: {
        example: {
          message: 'Hôpital créé avec succès',
          messageE: 'Hospital created successfully',
          data: {
            userId: 1,
            firstName: 'Hôpital Central',
            lastName: 'Yaoundé',
            email: 'contact@hopital-central.cm',
            phone: '691234567',
            userType: 'HOPITAL',
            city: 'Yaoundé',
            address: 'Boulevard du 20 Mai',
            profile: 'https://res.cloudinary.com/.../logo.png',
            isVerified: false,
            createdAt: '2024-03-21T10:00:00.000Z'
          }
        }
      }
    }),
    ApiResponse({
      status: 400,
      description: 'Données invalides'
    }),
    ApiResponse({
      status: 409,
      description: 'Email ou téléphone déjà utilisé'
    })
  );
}

// ==================== GET ALL HOPITAUX ====================
export function ApiGetAllHopitaux() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({ 
      summary: 'Lister tous les hôpitaux',
      description: 'Retourne la liste paginée des hôpitaux avec filtres'
    }),
    ApiQuery({ name: 'search', required: false, type: String, description: 'Recherche par nom' }),
    ApiQuery({ name: 'city', required: false, type: String, description: 'Filtrer par ville' }),
    ApiQuery({ name: 'page', required: false, type: Number, default: 1 }),
    ApiQuery({ name: 'limit', required: false, type: Number, default: 20 }),
    ApiResponse({
      status: 200,
      description: 'Liste des hôpitaux récupérée avec succès'
    })
  );
}

// ==================== GET HOPITAL BY ID ====================
export function ApiGetHopitalById() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({ 
      summary: 'Obtenir un hôpital par son ID',
      description: 'Retourne les détails complets d\'un hôpital avec ses médecins affiliés et réservations'
    }),
    ApiParam({ name: 'id', description: 'ID de l\'hôpital', type: Number, example: 1 }),
    ApiResponse({
      status: 200,
      description: 'Hôpital trouvé avec succès'
    }),
    ApiResponse({
      status: 404,
      description: 'Hôpital non trouvé'
    })
  );
}

// ==================== UPDATE HOPITAL ====================
export function ApiUpdateHopital() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({ 
      summary: 'Mettre à jour un hôpital',
      description: 'Met à jour les informations d\'un hôpital (profil accepte base64 ou URL)'
    }),
    ApiParam({ name: 'id', description: 'ID de l\'hôpital', type: Number, example: 1 }),
    ApiBody({ type: UpdateHopitalDto }),
    ApiResponse({
      status: 200,
      description: 'Hôpital mis à jour avec succès'
    }),
    ApiResponse({
      status: 404,
      description: 'Hôpital non trouvé'
    })
  );
}

// ==================== ADD MEDECINS TO HOPITAL ====================
export function ApiAddMedecinsToHopital() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({ 
      summary: 'Ajouter des médecins à l\'hôpital',
      description: 'Ajoute plusieurs médecins existants à l\'établissement hospitalier (ignore les doublons)'
    }),
    ApiParam({ name: 'id', description: 'ID de l\'hôpital', type: Number, example: 1 }),
    ApiBody({ type: AddMedecinsDto }),
    ApiResponse({
      status: 200,
      description: 'Médecins ajoutés avec succès',
      schema: {
        example: {
          message: '2 médecin(s) ajouté(s) avec succès. 1 déjà affilié(s) ignoré(s).',
          messageE: '2 doctor(s) added successfully. 1 already affiliated ignored.',
          added: [{ medecinId: 15, hopitalId: 1, medecin: { firstName: 'Jean', lastName: 'MBALLA' } }],
          skipped: [23]
        }
      }
    }),
    ApiResponse({
      status: 404,
      description: 'Hôpital ou médecin non trouvé'
    })
  );
}

// ==================== REMOVE MEDECINS FROM HOPITAL ====================
export function ApiRemoveMedecinsFromHopital() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({ 
      summary: 'Retirer des médecins de l\'hôpital',
      description: 'Retire plusieurs médecins affiliés de l\'établissement (ignore les non-affiliés)'
    }),
    ApiParam({ name: 'id', description: 'ID de l\'hôpital', type: Number, example: 1 }),
    ApiBody({ type: RemoveMedecinsDto }),
    ApiResponse({
      status: 200,
      description: 'Médecins retirés avec succès',
      schema: {
        example: {
          message: '2 médecin(s) retiré(s) avec succès. 1 non affilié(s) ignoré(s).',
          messageE: '2 doctor(s) removed successfully. 1 not affiliated ignored.',
          removed: [15, 23],
          skipped: [42]
        }
      }
    })
  );
}

// ==================== GET HOPITAL MEDECINS ====================
export function ApiGetHopitalMedecins() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({ 
      summary: 'Lister les médecins d\'un hôpital',
      description: 'Retourne la liste de tous les médecins affiliés à l\'hôpital'
    }),
    ApiParam({ name: 'id', description: 'ID de l\'hôpital', type: Number, example: 1 }),
    ApiQuery({ name: 'page', required: false, type: Number, default: 1 }),
    ApiQuery({ name: 'limit', required: false, type: Number, default: 20 }),
    ApiResponse({
      status: 200,
      description: 'Liste des médecins récupérée avec succès'
    })
  );
}

// ==================== GET HOPITAL RESERVATIONS ====================
export function ApiGetHopitalReservations() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({ 
      summary: 'Lister les réservations d\'un hôpital',
      description: 'Retourne la liste des consultations en présentiel réservées dans l\'hôpital'
    }),
    ApiParam({ name: 'id', description: 'ID de l\'hôpital', type: Number, example: 1 }),
    ApiQuery({ name: 'status', required: false, type: String, description: 'Filtrer par statut' }),
    ApiQuery({ name: 'date', required: false, type: String, description: 'Filtrer par date (YYYY-MM-DD)' }),
    ApiQuery({ name: 'page', required: false, type: Number, default: 1 }),
    ApiQuery({ name: 'limit', required: false, type: Number, default: 20 }),
    ApiResponse({
      status: 200,
      description: 'Liste des réservations récupérée avec succès'
    })
  );
}

// ==================== GET HOPITAL STATS ====================
export function ApiGetHopitalStats() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({ 
      summary: 'Statistiques de l\'hôpital',
      description: 'Retourne les statistiques d\'activité et financières de l\'hôpital'
    }),
    ApiParam({ name: 'id', description: 'ID de l\'hôpital', type: Number, example: 1 }),
    ApiResponse({
      status: 200,
      description: 'Statistiques récupérées avec succès'
    })
  );
}