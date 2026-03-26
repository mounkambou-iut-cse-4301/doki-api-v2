import { applyDecorators } from '@nestjs/common';
import { 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth,
  ApiBody
} from '@nestjs/swagger';
import { CreateSettingDto } from '../dto/create-setting.dto';
import { UpdateSettingDto } from '../dto/update-setting.dto';
import { SettingResponseDto } from '../dto/setting-response.dto';

// ==================== CREATE OR UPDATE ====================
export function ApiCreateOrUpdateSetting() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({ 
      summary: 'Créer ou mettre à jour la configuration des commissions',
      description: 'Crée une nouvelle configuration ou met à jour la configuration existante des commissions'
    }),
    ApiBody({ type: CreateSettingDto }),
    ApiResponse({
      status: 200,
      description: 'Configuration créée/mise à jour avec succès',
      type: SettingResponseDto
    }),
    ApiResponse({
      status: 400,
      description: 'Données invalides (pourcentage > 100, valeur négative, etc.)'
    }),
    ApiResponse({
      status: 401,
      description: 'Non authentifié'
    }),
    ApiResponse({
      status: 403,
      description: 'Accès non autorisé (admin uniquement)'
    })
  );
}

// ==================== GET SETTINGS ====================
export function ApiGetSettings() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({ 
      summary: 'Récupérer la configuration des commissions',
      description: 'Retourne la configuration actuelle des commissions pour les consultations en ligne et en présentiel'
    }),
    ApiResponse({
      status: 200,
      description: 'Configuration récupérée avec succès',
      schema: {
        example: {
          message: 'Configuration récupérée avec succès',
          messageE: 'Settings retrieved successfully',
          data: {
            settingId: 1,
            onlineType: 'PERCENTAGE',
            onlineValue: 10,
            onsiteType: 'PERCENTAGE',
            onsiteValue: 15,
            description: 'Commission: 10% en ligne, 15% en présentiel',
            updatedBy: 1,
            createdAt: '2026-03-26T10:00:00.000Z',
            updatedAt: '2026-03-26T10:00:00.000Z'
          }
        }
      }
    })
  );
}

// ==================== UPDATE SETTINGS ====================
export function ApiUpdateSettings() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({ 
      summary: 'Mettre à jour la configuration des commissions',
      description: 'Met à jour la configuration existante des commissions'
    }),
    ApiBody({ type: UpdateSettingDto }),
    ApiResponse({
      status: 200,
      description: 'Configuration mise à jour avec succès',
      type: SettingResponseDto
    }),
    ApiResponse({
      status: 400,
      description: 'Données invalides'
    }),
    ApiResponse({
      status: 401,
      description: 'Non authentifié'
    }),
    ApiResponse({
      status: 403,
      description: 'Accès non autorisé (admin uniquement)'
    }),
    ApiResponse({
      status: 404,
      description: 'Configuration non trouvée'
    })
  );
}