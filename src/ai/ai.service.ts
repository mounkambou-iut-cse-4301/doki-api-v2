import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class OpenaiService {
  private readonly logger = new Logger(OpenaiService.name);
  private client: OpenAI;

  constructor(private readonly config: ConfigService) {
    this.client = new OpenAI({
      apiKey: this.config.get<string>('OPENAI_API_KEY'),
    });
  }

  async generateMistidracsSummary(
    conversationId: number,
    payload: any,
  ) {
    const prompt = `
Tu es un assistant médical expert.

OBJECTIF :
Produire un RÉSUMÉ CLINIQUE DE DOULEUR selon la méthode MISTIDRACS, et identifier séparément les DRAPEAUX ROUGES.

RÈGLES :
- N'invente rien
- Utilise uniquement le JSON fourni
- "Non précisé" si absent
- Français, style médical
- Le champ "summary" contient UNIQUEMENT le résumé clinique (1 à 2 phrases), SANS les drapeaux rouges
- Le champ "drapeauRouge" contient UNIQUEMENT des alertes cliniques factuelles (vigilance, urgence potentielle, gravité possible) ; ne jamais poser de diagnostic ni extrapoler
- Si aucun drapeau rouge n'est identifiable, écrire exactement : "Aucun drapeau rouge identifié à partir des données fournies."

FORMAT JSON STRICT :
{
  "conversationId": number,
  "summary": string,
  "drapeauRouge": string
}

DONNÉES :
${JSON.stringify({ conversationId, payload })}
`.trim();

    try {
      const res = await this.client.chat.completions.create({
        model: 'gpt-4o-mini',
        temperature: 0,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
      });

      const parsed = JSON.parse(res.choices[0].message.content!);

      if (
        parsed.conversationId !== conversationId ||
        typeof parsed.summary !== 'string' ||
        typeof parsed.drapeauRouge !== 'string'
      ) {
        throw new Error('Format OpenAI invalide');
      }

      return parsed;
    } catch (e: any) {
      this.logger.error(e?.message ?? e);
      throw e;
    }
  }

  // src/ai/openai.service.ts
async generateJson(prompt: string) {
  const res = await this.client.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0,
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
  });

  const content = res.choices[0]?.message?.content;
  if (!content) {
    throw new Error('Réponse OpenAI vide');
  }

  return JSON.parse(content);
}

}
