import NextAuth, { type DefaultSession } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaAdapter } from '@auth/prisma-adapter';
import prisma from '@/lib/prisma';
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

const getAuthSecret = () => {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV !== 'production') {
    return 'dusunce_izi_super_secret_auth_key_2026_dev_spec';
  }
  return undefined;
};

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: getAuthSecret(),
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      // Only verified Google addresses, additionally checked against an existing teacher account.
      allowDangerousEmailAccountLinking: true,
    }),

  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Only pre-approved teacher/admin accounts can enter. Never auto-authorize
      // an arbitrary Google account as a teacher based on Prisma's default role.
      if (account?.provider !== 'google' || !user.email) return false;
      const googleProfile = profile as { email_verified?: boolean; email?: string } | undefined;
      if (googleProfile?.email_verified !== true || googleProfile.email?.toLowerCase() !== user.email.toLowerCase()) return false;
      const existing = await prisma.user.findUnique({
        where: { email: user.email.trim().toLowerCase() },
        select: { role: true },
      });
      return Boolean(existing && (existing.role === Role.TEACHER || existing.role === Role.ADMIN));
    },
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
      name: process.env.NODE_ENV === 'production' ? '__Secure-authjs.session-token' : 'authjs.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
});

/**
 * Server-side authorization helpers
 */
export async function getCurrentUser() {
  const session = await auth();
  return session?.user || null;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user?.id || !user.email) {
    throw new Error('UNAUTHORIZED: Authentication required');
  }
  const existing = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, email: true, role: true },
  });
  if (!existing || existing.email?.toLowerCase() !== user.email.toLowerCase()) {
    throw new Error('UNAUTHORIZED: Session is no longer valid');
  }
  return { ...user, role: existing.role };
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
