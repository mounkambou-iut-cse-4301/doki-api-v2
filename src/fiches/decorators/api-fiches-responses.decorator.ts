// src/fiches/decorators/api-fiches-responses.decorator.ts
import { applyDecorators } from '@nestjs/common';
import { 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody
} from '@nestjs/swagger';

// ==================== SUBMIT RESPONSE ====================
export function ApiSubmitFicheResponse() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({ 
      summary: 'Soumettre des réponses à une fiche',
      description: 'Permet à un patient de répondre à une fiche (questions TEXT/SELECT avec réponses multiples possibles)'
    }),
    ApiParam({
      name: 'id',
      description: 'ID de la fiche',
      type: Number,
      example: 1
    }),
    ApiBody({
      schema: {
        example: {
          patientId: 42,
          answers: [
            {
              questionId: "550e8400-e29b-41d4-a716-446655440000",
              value: ["1_jour", "2_jours"]
            },
            {
              questionId: "550e8400-e29b-41d4-a716-446655440001",
              value: "Fièvre depuis hier soir avec maux de tête"
            }
          ]
        }
      }
    }),
    ApiResponse({
      status: 201,
      description: 'Réponses enregistrées avec succès',
      schema: {
        example: {
          message: 'Réponses enregistrées avec succès.',
          messageE: 'Responses saved successfully.',
          data: {
            responseId: 'resp_001',
            ficheId: 1,
            patientId: 42,
            submittedAt: '2026-03-02T10:30:00.000Z',
            answers: [
              {
                questionId: '550e8400-e29b-41d4-a716-446655440000',
                question: 'Depuis quand as-tu le palu ?',
                type: 'SELECT',
                value: ['1_jour', '2_jours']
              },
              {
                questionId: '550e8400-e29b-41d4-a716-446655440001',
                question: 'Autres détails',
                type: 'TEXT',
                value: 'Fièvre depuis hier soir avec maux de tête'
              }
            ]
          }
        }
      }
    }),
    ApiResponse({
      status: 400,
      description: 'Données invalides',
      schema: {
        example: {
          message: 'Question [ID] introuvable dans cette fiche.',
          messageE: 'Question [ID] not found in this fiche.'
        }
      }
    }),
    ApiResponse({
      status: 404,
      description: 'Fiche introuvable',
      schema: {
        example: {
          message: 'Fiche introuvable.',
          messageE: 'Fiche not found.'
        }
      }
    })
  );
}

// ==================== GET RESPONSES ====================
export function ApiGetFicheResponses() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({ 
      summary: 'Lister les réponses d\'une fiche',
      description: 'Retourne toutes les réponses soumises pour une fiche (pagination + filtre par patient)'
    }),
    ApiParam({
      name: 'id',
      description: 'ID de la fiche',
      type: Number,
      example: 1
    }),
    ApiQuery({
      name: 'patientId',
      required: false,
      type: Number,
      description: 'Filtrer par patient',
      example: 42
    }),
    ApiQuery({
      name: 'page',
      required: false,
      type: Number,
      example: 1
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      type: Number,
      example: 20
    }),
    ApiResponse({
      status: 200,
      description: 'Réponses récupérées avec succès',
      schema: {
        example: {
          message: 'Réponses récupérées avec succès.',
          messageE: 'Responses retrieved successfully.',
          data: [
            {
              responseId: 'resp_001',
              patientId: 42,
              patientName: 'Jean Patient',
              submittedAt: '2026-03-02T10:30:00.000Z',
              answers: [
                {
                  questionId: '550e8400-e29b-41d4-a716-446655440000',
                  question: 'Depuis quand as-tu le palu ?',
                  type: 'SELECT',
                  value: ['1_jour', '2_jours']
                }
              ]
            },
            {
              responseId: 'resp_002',
              patientId: 43,
              patientName: 'Marie Malade',
              submittedAt: '2026-03-02T11:15:00.000Z',
              answers: [
                {
                  questionId: '550e8400-e29b-41d4-a716-446655440000',
                  question: 'Depuis quand as-tu le palu ?',
                  type: 'SELECT',
                  value: ['3_jours']
                }
              ]
            }
          ],
          meta: {
            total: 15,
            page: 1,
            limit: 20,
            lastPage: 1
          }
        }
      }
    }),
    ApiResponse({
      status: 404,
      description: 'Fiche introuvable',
      schema: {
        example: {
          message: 'Fiche introuvable.',
          messageE: 'Fiche not found.'
        }
      }
    })
  );
}

// ==================== GET RESPONSE BY ID ====================
export function ApiGetFicheResponseById() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({ 
      summary: 'Obtenir une réponse spécifique',
      description: 'Retourne les détails d\'une réponse soumise par son ID'
    }),
    ApiParam({
      name: 'id',
      description: 'ID de la fiche',
      type: Number,
      example: 1
    }),
    ApiParam({
      name: 'responseId',
      description: 'ID de la réponse (généré lors de la soumission)',
      type: String,
      example: 'resp_001'
    }),
    ApiResponse({
      status: 200,
      description: 'Réponse récupérée avec succès',
      schema: {
        example: {
          message: 'Réponse récupérée avec succès.',
          messageE: 'Response retrieved successfully.',
          data: {
            responseId: 'resp_001',
            ficheId: 1,
            ficheTitle: 'Paludisme - Anamnèse',
            patientId: 42,
            patientName: 'Jean Patient',
            patientPhone: '+237699123456',
            submittedAt: '2026-03-02T10:30:00.000Z',
            answers: [
              {
                questionId: '550e8400-e29b-41d4-a716-446655440000',
                question: 'Depuis quand as-tu le palu ?',
                type: 'SELECT',
                options: [
                  { label: 'Un jour', value: '1_jour' },
                  { label: 'Deux jours', value: '2_jours' },
                  { label: 'Trois jours', value: '3_jours' }
                ],
                value: ['1_jour', '2_jours']
              },
              {
                questionId: '550e8400-e29b-41d4-a716-446655440001',
                question: 'Autres détails',
                type: 'TEXT',
                value: 'Fièvre depuis hier soir avec maux de tête'
              }
            ]
          }
        }
      }
    }),
    ApiResponse({
      status: 404,
      description: 'Réponse introuvable',
      schema: {
        example: {
          message: 'Réponse introuvable.',
          messageE: 'Response not found.'
        }
      }
    })
  );
}