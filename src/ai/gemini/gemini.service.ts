import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private clientPromise: Promise<any> | null = null;

  constructor(private readonly config: ConfigService) {}

  private async getClient() {
    if (!this.clientPromise) {
      this.clientPromise = (async () => {
        const mod: any = await import('@google/genai');
        const { GoogleGenAI } = mod;
        const apiKey = this.config.get<string>('GEMINI_API_KEY');
        return apiKey ? new GoogleGenAI({ apiKey }) : new GoogleGenAI({});
      })();
    }
    return this.clientPromise;
  }

  private async withRetry<T>(
    fn: () => Promise<T>,
    maxRetries = 5,
    delayMs = 800,
  ): Promise<T> {
    let attempt = 0;
    while (true) {
      try {
        return await fn();
      } catch (e: any) {
        if (e?.status === 503 && attempt < maxRetries) {
          attempt++;
          this.logger.warn(`Gemini 503 → retry ${attempt}/${maxRetries}`);
          await new Promise(r => setTimeout(r, delayMs * attempt));
          continue;
        }
        throw e;
      }
    }
  }

  async generateMistidracsSummary(
    conversationId: number,
    payload: any,
  ) {
    const ai = await this.getClient();

 const prompt = `
Tu es un assistant médical spécialisé dans la synthèse de fiches cliniques.

Tâche :
Transformer des fiches structurées en un **résumé médical clair**, destiné à un médecin.

⚠️ RÈGLES ABSOLUES :
- Ne jamais inventer d’information.
- Ne jamais poser de diagnostic.
- Ne pas lister ; rédiger un **texte fluide**.
- Produire **un seul paragraphe**.
- Respecter strictement l’ordre MISTIDRACS pour le **symptôme principal**.
- Pour les symptômes secondaires : mentionner seulement la **nature, la durée et le siège si pertinent**.
- Regrouper les **signes associés communs** à la fin.
- Si une information est absente, écrire "Non précisé".
- Français, style médical, 1 à 2 phrases par symptôme.

ORDRE MISTIDRACS pour le symptôme principal :
1. Mode d’apparition
2. Durée
3. Intensité
4. Siège
5. Type
6. Irradiation
7. Rythme
8. Aggravants
9. Calmants
10. Signes associés

FORMAT DE SORTIE :
- Un paragraphe médical clair, en français.
- Pas de titres, pas de listes.
- Format JSON strict :
{
  "conversationId": number,
  "summary": string
}

DONNÉES À UTILISER (ne rien inventer) :
${JSON.stringify({ conversationId, payload })}

INSTRUCTIONS SUPPLÉMENTAIRES :
- Adapter le résumé au contexte réel des symptômes.
- Commencer par le **symptôme principal** en respectant MISTIDRACS complet.
- Les symptômes secondaires suivent avec les informations minimales (nature, durée, siège si pertinent).
- Les signes associés communs doivent être regroupés à la fin.
`.trim();


    return this.withRetry(async () => {
      const res = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' },
      });

      const parsed = JSON.parse(res.text ?? '');

      if (
        parsed.conversationId !== conversationId ||
        typeof parsed.summary !== 'string'
      ) {
        throw new Error('Format Gemini invalide');
      }

      return parsed;
    });
  }


  // src/ai/gemini/gemini.service.ts
async generateJson(prompt: string) {
  const ai = await this.getClient();

  const res = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
    },
  });

  if (!res.text) {
    throw new Error('Réponse Gemini vide');
  }

  return JSON.parse(res.text);
}

}
