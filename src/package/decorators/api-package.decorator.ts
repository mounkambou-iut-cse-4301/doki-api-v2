import { applyDecorators } from '@nestjs/common';
import { 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody
} from '@nestjs/swagger';
import { CreatePackageDto } from '../dto/create-package.dto';
import { UpdatePackageDto } from '../dto/update-package.dto';

// ==================== CREATE ====================
export function ApiCreatePackage() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({ 
      summary: 'Créer un package d\'abonnement',
      description: 'Crée un nouveau package pour une spécialité'
    }),
    ApiBody({ type: CreatePackageDto }),
    ApiResponse({
      status: 201,
      description: 'Package créé avec succès',
      schema: {
        example: {
          message: 'Package créé avec succès',
          messageE: 'Package created successfully',
          data: {
            packageId: 1,
            nom: 'Pack Cardiologie Premium',
            specialityId: 1,
            nombreConsultations: 5,
            chatInclus: true,
            appelInclus: true,
            prix: 25000,
            dureeValiditeJours: 30,
            isActive: true,
            createdAt: '2026-03-21T10:00:00.000Z',
            speciality: {
              specialityId: 1,
              name: 'Cardiologie',
              consultationPrice: 5000
            }
          }
        }
      }
    }),
    ApiResponse({
      status: 400,
      description: 'Données invalides'
    }),
    ApiResponse({
      status: 404,
      description: 'Spécialité non trouvée'
    })
  );
}

// ==================== GET ALL ====================
export function ApiGetAllPackages() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({ 
      summary: 'Lister tous les packages',
      description: 'Retourne la liste paginée des packages avec filtres'
    }),
    ApiQuery({ name: 'search', required: false, type: String, description: 'Recherche par nom' }),
    ApiQuery({ name: 'specialityId', required: false, type: Number, description: 'Filtrer par spécialité' }),
    ApiQuery({ name: 'isActive', required: false, type: Boolean, description: 'Filtrer par statut' }),
    ApiQuery({ name: 'page', required: false, type: Number, default: 1 }),
    ApiQuery({ name: 'limit', required: false, type: Number, default: 20 }),
    ApiResponse({
      status: 200,
      description: 'Liste des packages récupérée avec succès'
    })
  );
}

// ==================== GET ONE ====================
export function ApiGetPackageById() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({ 
      summary: 'Obtenir un package par son ID',
      description: 'Retourne les détails complets d\'un package'
    }),
    ApiParam({ name: 'id', description: 'ID du package', type: Number, example: 1 }),
    ApiResponse({
      status: 200,
      description: 'Package trouvé avec succès',
      schema: {
        example: {
          message: 'Package récupéré avec succès',
          messageE: 'Package retrieved successfully',
          data: {
            packageId: 1,
            nom: 'Pack Cardiologie Premium',
            specialityId: 1,
            nombreConsultations: 5,
            chatInclus: true,
            appelInclus: true,
            prix: 25000,
            dureeValiditeJours: 30,
            isActive: true,
            createdAt: '2026-03-21T10:00:00.000Z',
            updatedAt: '2026-03-21T10:00:00.000Z',
            speciality: {
              specialityId: 1,
              name: 'Cardiologie',
              consultationPrice: 5000,
              consultationDuration: 30
            },
            abonnements: [
              {
                abonnementId: 1,
                patientId: 14,
                debutDate: '2026-03-01T00:00:00.000Z',
                endDate: '2026-03-31T00:00:00.000Z',
                status: 'CONFIRMED'
              }
            ],
            nombreAbonnements: 12
          }
        }
      }
    }),
    ApiResponse({
      status: 404,
      description: 'Package non trouvé'
    })
  );
}

// ==================== UPDATE ====================
export function ApiUpdatePackage() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({ 
      summary: 'Mettre à jour un package',
      description: 'Met à jour les informations d\'un package'
    }),
    ApiParam({ name: 'id', description: 'ID du package', type: Number, example: 1 }),
    ApiBody({ type: UpdatePackageDto }),
    ApiResponse({
      status: 200,
      description: 'Package mis à jour avec succès',
      schema: {
        example: {
          message: 'Package mis à jour avec succès',
          messageE: 'Package updated successfully',
          data: {
            packageId: 1,
            nom: 'Pack Cardiologie Premium',
            prix: 27000,
            isActive: true
          }
        }
      }
    }),
    ApiResponse({
      status: 400,
      description: 'Données invalides'
    }),
    ApiResponse({
      status: 404,
      description: 'Package non trouvé'
    })
  );
}

// ==================== DELETE ====================
export function ApiDeletePackage() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({ 
      summary: 'Supprimer un package',
      description: 'Supprime un package (uniquement si aucun abonnement associé)'
    }),
    ApiParam({ name: 'id', description: 'ID du package', type: Number, example: 1 }),
    ApiResponse({
      status: 200,
      description: 'Package supprimé avec succès',
      schema: {
        example: {
          message: 'Package supprimé avec succès',
          messageE: 'Package deleted successfully'
        }
      }
    }),
    ApiResponse({
      status: 400,
      description: 'Impossible de supprimer (des abonnements existent)',
      schema: {
        example: {
          message: 'Impossible de supprimer ce package car des abonnements sont associés',
          messageE: 'Cannot delete this package because subscriptions are associated'
        }
      }
    }),
    ApiResponse({
      status: 404,
      description: 'Package non trouvé'
    })
  );
}

// ==================== ACTIVATE ====================
export function ApiActivatePackage() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({ 
      summary: 'Activer un package',
      description: 'Active un package (le rend disponible à l\'achat)'
    }),
    ApiParam({ name: 'id', description: 'ID du package', type: Number, example: 1 }),
    ApiResponse({
      status: 200,
      description: 'Package activé avec succès',
      schema: {
        example: {
          message: 'Package activé avec succès',
          messageE: 'Package activated successfully',
          data: {
            packageId: 1,
            nom: 'Pack Cardiologie Premium',
            isActive: true
          }
        }
      }
    }),
    ApiResponse({
      status: 404,
      description: 'Package non trouvé'
    })
  );
}

// ==================== DEACTIVATE ====================
export function ApiDeactivatePackage() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({ 
      summary: 'Désactiver un package',
      description: 'Désactive un package (le rend indisponible à l\'achat)'
    }),
    ApiParam({ name: 'id', description: 'ID du package', type: Number, example: 1 }),
    ApiResponse({
      status: 200,
      description: 'Package désactivé avec succès',
      schema: {
        example: {
          message: 'Package désactivé avec succès',
          messageE: 'Package deactivated successfully',
          data: {
            packageId: 1,
            nom: 'Pack Cardiologie Premium',
            isActive: false
          }
        }
      }
    }),
    ApiResponse({
      status: 404,
      description: 'Package non trouvé'
    })
  );
}

// ==================== GET BY SPECIALITY ====================
export function ApiGetPackagesBySpeciality() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({ 
      summary: 'Lister les packages d\'une spécialité',
      description: 'Retourne tous les packages actifs pour une spécialité donnée'
    }),
    ApiParam({ name: 'specialityId', description: 'ID de la spécialité', type: Number, example: 1 }),
    ApiQuery({ name: 'onlyActive', required: false, type: Boolean, default: true, description: 'Uniquement les packages actifs' }),
    ApiResponse({
      status: 200,
      description: 'Liste des packages récupérée avec succès'
    })
  );
}