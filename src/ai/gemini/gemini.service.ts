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
Tu es un assistant médical spécialisé dans la synthèse de fiches cliniques structurées.
Ton rôle est de produire un résumé médical clair, fiable et exploitable par un médecin.

TÂCHE :
Transformer des fiches cliniques structurées en un résumé médical narratif destiné exclusivement à un professionnel de santé.

⚠️ RÈGLES ABSOLUES (NON NÉGOCIABLES) :
- Ne jamais inventer d’information.
- Ne jamais interpréter ni poser de diagnostic.
- Ne jamais proposer d’hypothèse étiologique.
- Ne jamais extrapoler.
- Utiliser exclusivement les informations présentes dans les données fournies.
- Si une information est absente, écrire exactement : "Non précisé".
- Si un élément n’est pas cliniquement pertinent pour le symptôme concerné, écrire : "Non pertinent".
- Français médical standard.
- Ton professionnel, neutre.
- Texte fluide, narratif.
- Aucune liste à puces.
- Aucun titre visible.
- Respect strict du format JSON demandé.

────────────────────────────────────────
STRUCTURE DU RÉSUMÉ CLINIQUE (CHAMP summary) :

Le champ "summary" doit contenir **DEUX PARAGRAPHES DISTINCTS**, dans cet ordre strict :

PARAGRAPHE 1 — RÉSUMÉ CLINIQUE :
- Commencer obligatoirement par le symptôme principal.
- L’ordre MISTIDRACS n’est pas obligatoire mais sert de référence.
- La priorité est la cohérence et la logique médicale.
- Ne jamais forcer un élément MISTIDRACS lorsqu’il n’a pas de sens clinique.
- Les éléments non pertinents doivent être signalés comme tels sans alourdir le texte.

ORDRE DE RÉFÉRENCE MISTIDRACS (SYMPTÔME PRINCIPAL) :
1. Mode d’apparition
2. Durée
3. Intensité
4. Siège (si pertinent)
5. Type / caractère
6. Irradiation (si pertinente)
7. Rythme / évolution
8. Facteurs aggravants
9. Facteurs calmants
10. Signes associés
11. Antécédents

SYMPTÔMES SECONDAIRES :
- Mentionner uniquement :
  - la nature,
  - la durée,
  - le siège si pertinent.
- Une à deux phrases maximum par symptôme secondaire.

SIGNES ASSOCIÉS :
- Regrouper à la fin de ce paragraphe les signes associés communs.
- Ne pas répéter les informations déjà mentionnées.

────────────────────────────────────────
PARAGRAPHE 2 — DRAPEAUX ROUGES (DESTINÉ AU MÉDECIN UNIQUEMENT) :

- Ce paragraphe doit contenir uniquement des ALERTES CLINIQUES FACTUELLES.
- Ne jamais poser de diagnostic.
- Ne jamais interpréter.
- Ne jamais extrapoler.
- Se baser exclusivement sur les données présentes dans la fiche structurée.
- Mentionner uniquement les éléments objectivement présents pouvant nécessiter une vigilance clinique particulière
  (urgence potentielle, gravité possible, complication possible, situation atypique ou à risque).
- Ne jamais évoquer un risque non explicitement suggéré par les données.
- Si aucune situation de vigilance n’est identifiable, écrire exactement :
  "Aucun drapeau rouge identifié à partir des données fournies."
- Français médical standard.
- Ton neutre, professionnel.
- Un seul paragraphe.
- Ce contenu est strictement réservé au médecin et ne doit jamais être affiché au patient.

────────────────────────────────────────
FORMAT DE SORTIE STRICT (JSON) :

{
  "conversationId": number,
  "summary": string
}

────────────────────────────────────────
DONNÉES À UTILISER (NE RIEN INVENTER) :
${JSON.stringify({ conversationId, payload })}

────────────────────────────────────────
INSTRUCTIONS CLINIQUES FINALES :

- Le champ "summary" doit contenir exactement deux paragraphes séparés par un saut de ligne.
- Aucun autre champ ne doit être ajouté.
- Le résumé doit être immédiatement compréhensible par un médecin.
- Toute ambiguïté doit être conservée, jamais corrigée.
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
