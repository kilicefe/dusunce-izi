import NextAuth, { type DefaultSession } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import prisma from '@/lib/prisma';
import { requiresGoogleAuthConfig } from '@/lib/authEnvironment';
import { Role } from '@prisma/client';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: Role;
    } & DefaultSession['user'];
  }

  interface User {
    role?: Role;
  }
}

const isProduction = process.env.NODE_ENV === 'production';
const testAuthEnabled = !isProduction && process.env.ENABLE_TEST_AUTH === 'true';
const googleAuthConfigured = Boolean(
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
);
const googleAuthRequired = requiresGoogleAuthConfig(process.env);

function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (secret) return secret;

  if (!isProduction) {
    return 'dusunce_izi_super_secret_auth_key_2026_dev_spec';
  }

  throw new Error(
    'CRITICAL_AUTH_CONFIG_MISSING: AUTH_SECRET is required in production.'
  );
}

if (googleAuthRequired && !googleAuthConfigured) {
  throw new Error(
    'CRITICAL_AUTH_CONFIG_MISSING: GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are required in production.'
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: getAuthSecret(),
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
  providers: [
    ...(googleAuthConfigured
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          }),
        ]
      : []),
    ...(testAuthEnabled
      ? [
          CredentialsProvider({
            name: 'Test Credentials',
            credentials: {
              email: { label: 'Email', type: 'email' },
              password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
              const configuredPassword = process.env.E2E_TEST_PASSWORD;
              if (!configuredPassword || !credentials?.email || !credentials?.password) {
                return null;
              }

              if (String(credentials.password) !== configuredPassword) {
                return null;
              }

              const email = String(credentials.email).toLowerCase().trim();
              const user = await prisma.user.findUnique({ where: { email } });
              if (!user) return null;

              return {
                id: user.id,
                email: user.email,
                name: user.name,
                image: user.image,
                role: user.role,
              };
            },
          }),
        ]
      : []),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role || Role.TEACHER;
      } else if (token.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email },
          select: { id: true, role: true },
        });
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role as Role) || Role.TEACHER;
      }
      return session;
    },
  },
  pages: {
    signIn: '/sign-in',
  },
  cookies: {
    sessionToken: {
      name: isProduction ? '__Secure-authjs.session-token' : 'authjs.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: isProduction,
      },
    },
  },
});

export async function getCurrentUser() {
  const session = await auth();
  return session?.user || null;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('UNAUTHORIZED: Authentication required');
  }
  return user;
}

export async function requireTeacher() {
  const user = await requireUser();
  if (user.role !== Role.TEACHER && user.role !== Role.ADMIN) {
    throw new Error('FORBIDDEN: Teacher role required');
  }
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== Role.ADMIN) {
    throw new Error('FORBIDDEN: Admin role required');
  }
  return user;
}
