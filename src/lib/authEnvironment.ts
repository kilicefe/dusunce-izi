import { randomBytes } from 'node:crypto';

type AuthEnvironment = Partial<
  Pick<NodeJS.ProcessEnv, 'NODE_ENV' | 'VERCEL_ENV'>
>;

export function requiresGoogleAuthConfig(environment: AuthEnvironment): boolean {
  return (
    environment.NODE_ENV === 'production' && environment.VERCEL_ENV !== 'preview'
  );
}

export function allowsEphemeralPreviewAuthSecret(
  environment: AuthEnvironment,
  googleAuthConfigured: boolean
): boolean {
  return (
    environment.NODE_ENV === 'production' &&
    environment.VERCEL_ENV === 'preview' &&
    !googleAuthConfigured
  );
}

export function generateEphemeralPreviewAuthSecret(): string {
  return randomBytes(32).toString('base64url');
}
