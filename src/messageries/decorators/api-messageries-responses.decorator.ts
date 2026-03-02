// src/messageries/decorators/api-messageries-responses.decorator.ts
import { applyDecorators } from '@nestjs/common';
import { 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth,
  ApiBody,
  ApiParam,
  ApiQuery
} from '@nestjs/swagger';

// ==================== SOUMETTRE RÉPONSES FICHE ====================
export function ApiSubmitFicheResponse() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({ 
      summary: 'Soumettre des réponses à une fiche',
      description: 'Permet à un patient de répondre à une fiche (supporte les réponses multiples pour les questions SELECT)'
    }),
    ApiBody({
      schema: {
        example: {
          ficheId: 1,
          conversationId: 5,
          senderId: 7,
          answers: [
            {
              questionId: "550e8400-e29b-41d4-a716-446655440000",
              optionValue: ["1_jour", "2_jours"]  // ✅ Réponses multiples
            },
            {
              questionId: "550e8400-e29b-41d4-a716-446655440001",
              valueText: "Fièvre depuis hier soir avec maux de tête"
            }
          ],
          requestMessageId: 42
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
          response: {
            id: "resp_1740934200000_abc123",
            conversationId: 5,
            senderId: 7,
            submittedForUserId: null,
            submittedAt: "2026-03-02T15:30:00.000Z",
            items: [
              {
                questionId: "550e8400-e29b-41d4-a716-446655440000",
                optionValue: ["1_jour", "2_jours"]
              },
              {
                questionId: "550e8400-e29b-41d4-a716-446655440001",
                valueText: "Fièvre depuis hier soir avec maux de tête"
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
          message: 'La question "Depuis quand ?" n\'autorise qu\'une seule réponse mais 2 ont été fournies.',
          messageE: 'Question "Depuis quand ?" allows only one answer but 2 were provided.'
        }
      }
    })
  );
}

// ==================== LISTER RÉPONSES FICHE ====================
export function ApiListFicheResponses() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({ 
      summary: 'Lister les réponses de fiches pour une conversation',
      description: 'Retourne toutes les réponses soumises dans une conversation, avec les questions enrichies'
    }),
    ApiParam({
      name: 'conversationId',
      description: 'ID de la conversation',
      type: Number,
      example: 5
    }),
    ApiResponse({
      status: 200,
      description: 'Réponses récupérées avec succès',
      schema: {
        example: {
          items: [
            {
              ficheId: 1,
              ficheTitle: 'Paludisme - Anamnèse',
              responseId: "resp_1740934200000_abc123",
              conversationId: 5,
              senderId: 7,
              submittedForUserId: null,
              submittedAt: "2026-03-02T15:30:00.000Z",
              items: [
                {
                  questionId: "550e8400-e29b-41d4-a716-446655440000",
                  optionValue: ["1_jour", "2_jours"],
                  question: {
                    id: "550e8400-e29b-41d4-a716-446655440000",
                    label: "Depuis quand as-tu le palu ?",
                    type: "SELECT",
                    multiple: true,
                    options: [
                      { label: "Un jour", value: "1_jour" },
                      { label: "Deux jours", value: "2_jours" },
                      { label: "Trois jours", value: "3_jours" }
                    ]
                  }
                },
                {
                  questionId: "550e8400-e29b-41d4-a716-446655440001",
                  valueText: "Fièvre depuis hier soir avec maux de tête",
                  question: {
                    id: "550e8400-e29b-41d4-a716-446655440001",
                    label: "Autres détails",
                    type: "TEXT"
                  }
                }
              ]
            }
          ]
        }
      }
    })
  );
}

// ==================== RÉSUMÉ DE CONVERSATION ====================
export function ApiConversationSummary() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({ 
      summary: 'Générer un résumé de conversation',
      description: 'Analyse toutes les réponses de la conversation et génère un résumé médical structuré prenant en compte les réponses multiples'
    }),
    ApiParam({
      name: 'conversationId',
      description: 'ID de la conversation',
      type: Number,
      example: 5
    }),
    ApiResponse({
      status: 200,
      description: 'Résumé généré avec succès',
      schema: {
        example: {
          conversationId: 5,
          summary: "Le patient présente un palu depuis 1-2 jours, localisée à la tête, de type brûlure, avec fièvre. Le patient rapporte également des maux de tête depuis 3 jours, localisée au front, avec nausées. L'ensemble est accompagné de fièvre et nausées."
        }
      }
    })
  );
}

// ==================== RÉSUMÉ MISTIDRACS ====================
export function ApiMistidracsSummary() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({ 
      summary: 'Générer un résumé MISTIDRACS',
      description: 'Génère un résumé structuré selon le format MISTIDRACS (Mode, Irradiation, Siège, Type, Intensité, Durée, Rythme, Antécédents, Circonstances, Signes)'
    }),
    ApiParam({
      name: 'conversationId',
      description: 'ID de la conversation',
      type: Number,
      example: 5
    }),
    ApiQuery({
      name: 'provider',
      required: false,
      enum: ['openai', 'gemini'],
      description: 'Fournisseur AI à utiliser'
    }),
    ApiResponse({
      status: 200,
      description: 'Résumé MISTIDRACS généré',
      schema: {
        example: {
          mistidracs: {
            mode: "apparue progressivement",
            irradiation: "avec irradiation vers le bras",
            siege: "thoracique gauche",
            type: "serrement",
            intensite: "7/10",
            duree: "depuis 3 heures",
            rythme: "permanent",
            antecedents: "HTA",
            circonstances: "au repos",
            signes: "sueurs, nausées"
          },
          raw: "Douleur thoracique gauche en serrement, apparue progressivement il y a 3 heures..."
        }
      }
    })
  );
}

// ==================== EXPLIQUER QUESTION ====================
export function ApiExplainQuestion() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({ 
      summary: 'Expliquer une question médicale',
      description: 'Utilise l\'IA pour expliquer une question médicale en français simple'
    }),
    ApiBody({
      schema: {
        example: {
          ficheId: 1,
          questionId: "550e8400-e29b-41d4-a716-446655440000",
          provider: "openai"
        }
      }
    }),
    ApiResponse({
      status: 200,
      description: 'Explication générée',
      schema: {
        example: {
          explanation: "Cette question demande depuis combien de temps le patient ressent les symptômes du paludisme. Les options permettent de préciser la durée : quelques minutes, heures, jours, semaines ou mois.",
          simplified: "On veut savoir quand les symptômes ont commencé."
        }
      }
    })
  );
}