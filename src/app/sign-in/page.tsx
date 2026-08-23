import SignInClient from './SignInClient';

export const dynamic = 'force-dynamic';

export default function SignInPage() {
  const googleAuthConfigured = Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
  );
  const testAuthEnabled =
    process.env.NODE_ENV !== 'production' && process.env.ENABLE_TEST_AUTH === 'true';

  return (
    <SignInClient
      googleAuthConfigured={googleAuthConfigured}
      testAuthEnabled={testAuthEnabled}
    />
  );
}
