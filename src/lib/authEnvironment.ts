type AuthEnvironment = Partial<
  Pick<NodeJS.ProcessEnv, 'NODE_ENV' | 'VERCEL_ENV'>
>;

export function requiresGoogleAuthConfig(environment: AuthEnvironment): boolean {
  return (
    environment.NODE_ENV === 'production' && environment.VERCEL_ENV !== 'preview'
  );
}
