import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
} from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const KEY_LENGTH = 32;
const SALT = 'solde-medecin-v1';

function getSecret(): string {
  const secret = process.env.BALANCE_ENCRYPTION_SECRET;
  if (!secret || secret.trim().length < 16) {
    throw new Error(
      'BALANCE_ENCRYPTION_SECRET est manquant ou trop court. Mets une valeur longue dans .env.',
    );
  }
  return secret;
}

function getKey(): Buffer {
  return scryptSync(getSecret(), SALT, KEY_LENGTH);
}

function normalizeMoneyString(value: string | number): string {
  const raw = String(value).trim().replace(',', '.');

  if (!/^-?\d+(\.\d{1,2})?$/.test(raw)) {
    throw new Error(
      `Montant invalide: "${value}". Utilise un nombre avec au plus 2 décimales.`,
    );
  }

  const negative = raw.startsWith('-');
  const clean = negative ? raw.slice(1) : raw;
  const [intPart, fracPart = ''] = clean.split('.');
  const normalized = `${negative ? '-' : ''}${intPart}.${(fracPart + '00').slice(0, 2)}`;

  return normalized;
}

function moneyStringToCents(value: string | number): bigint {
  const normalized = normalizeMoneyString(value);
  const negative = normalized.startsWith('-');
  const clean = negative ? normalized.slice(1) : normalized;
  const [intPart, fracPart] = clean.split('.');

  const cents = BigInt(intPart) * 100n + BigInt(fracPart);
  return negative ? -cents : cents;
}

function centsToMoneyNumber(cents: bigint): number {
  return Number(cents) / 100;
}

function encryptRaw(plainText: string): string {
  const iv = randomBytes(IV_LENGTH);
  const key = getKey();

  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plainText, 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

function decryptRaw(payload: string): string {
  const parts = payload.split(':');
  if (parts.length !== 3) {
    throw new Error('Format de solde chiffré invalide.');
  }

  const [ivHex, authTagHex, encryptedHex] = parts;
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const encrypted = Buffer.from(encryptedHex, 'hex');
  const key = getKey();

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
}

export function encryptBalance(value: string | number): string {
  const cents = moneyStringToCents(value);
  return encryptRaw(cents.toString());
}

export function decryptBalance(payload?: string | null): number {
  if (!payload) return 0;

  const centsAsString = decryptRaw(payload);
  const cents = BigInt(centsAsString);
  return centsToMoneyNumber(cents);
}

export function addToEncryptedBalance(
  currentEncryptedValue: string | null | undefined,
  increment: string | number,
): { encrypted: string; balance: number } {
  const currentCents = currentEncryptedValue
    ? BigInt(decryptRaw(currentEncryptedValue))
    : 0n;

  const incrementCents = moneyStringToCents(increment);
  const nextCents = currentCents + incrementCents;

  return {
    encrypted: encryptRaw(nextCents.toString()),
    balance: centsToMoneyNumber(nextCents),
  };
}

export function subtractFromEncryptedBalance(
  currentEncryptedValue: string | null | undefined,
  decrement: string | number,
): { encrypted: string; balance: number } {
  const currentCents = currentEncryptedValue
    ? BigInt(decryptRaw(currentEncryptedValue))
    : 0n;

  const decrementCents = moneyStringToCents(decrement);
  const nextCents = currentCents - decrementCents;

  if (nextCents < 0n) {
    throw new Error('Solde insuffisant.');
  }

  return {
    encrypted: encryptRaw(nextCents.toString()),
    balance: centsToMoneyNumber(nextCents),
  };
}