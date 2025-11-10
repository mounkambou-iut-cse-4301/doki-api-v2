import axios from 'axios';

export type ExpoPushMessage = {
  to: string;
  title?: string;
  body?: string;
  sound?: 'default' | null;
  data?: Record<string, any>;
  ttl?: number;
  priority?: 'default' | 'normal' | 'high';
  channelId?: string;
};

const EXPO_PUSH_ENDPOINT = 'https://exp.host/--/api/v2/push/send';

export function isValidExpoToken(token?: string | null): token is string {
  if (!token) return false;
  // Tokens Expo natifs : ExponentPushToken[xxxxx] (iOS/Android)
  // EAS peut aussi fournir ExponentPushToken[...] ou ExponentPushToken_xxx
  return /^ExponentPushToken(\[.+\]|_[A-Za-z0-9\-\._~]+)$/.test(token);
}

/**
 * Envoi d'une notification Expo (single).
 * Ne lève pas d'exception si Expo retourne une erreur, renvoie un objet "status" au lieu de throw.
 */
export async function sendExpoPush(message: ExpoPushMessage) {
  try {
    const res = await axios.post(EXPO_PUSH_ENDPOINT, message, {
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      timeout: 15_000,
    });
    return { ok: true, response: res.data };
  } catch (err: any) {
    return {
      ok: false,
      error: err?.response?.data ?? { message: err?.message ?? 'Expo push failed' },
    };
  }
}

/**
 * Envoi en lot (jusqu’à ~100 par call recommandé).
 * Retourne un tableau de résultats {ok/err} par message.
 */
export async function sendExpoMulticast(messages: ExpoPushMessage[]) {
  try {
    const res = await axios.post(EXPO_PUSH_ENDPOINT, messages, {
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      timeout: 20_000,
    });
    return { ok: true, response: res.data };
  } catch (err: any) {
    return {
      ok: false,
      error: err?.response?.data ?? { message: err?.message ?? 'Expo multicast failed' },
    };
  }
}

/** Concat FR/EN propre (titre/texte) */
export const bi = (fr: string, en: string) => `${fr}\n— ${en}`;
