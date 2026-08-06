import SignInClient from './SignInClient';

export const dynamic = 'force-dynamic';

export default function SignInPage() {
  const testAuthEnabled =
    process.env.NODE_ENV !== 'production' && process.env.ENABLE_TEST_AUTH === 'true';

  return <SignInClient testAuthEnabled={testAuthEnabled} />;
}
