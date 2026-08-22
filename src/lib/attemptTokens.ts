import { createHash, randomBytes } from 'node:crypto';

const ATTEMPT_TOKEN_BYTES = 32;
const MAX_TOKEN_LENGTH = 256;

export function generateAttemptToken(): string {
  return randomBytes(ATTEMPT_TOKEN_BYTES).toString('base64url');
}

export function hashAttemptToken(token: string): string {
  const normalized = token.trim();
  if (!normalized || normalized.length > MAX_TOKEN_LENGTH) {
    throw new Error('INVALID_ATTEMPT_TOKEN');
  }

  return createHash('sha256').update(normalized, 'utf8').digest('hex');
}
