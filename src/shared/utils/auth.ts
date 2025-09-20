import type { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { getUserByEmail } from '@/services/firebase/userServices';
import { userService } from '@/services/firebase/genericServices';
import { AUTH_ROUTES } from '@/shared/constantsRoutes/routes';
import { useUserStore } from '@/shared/store/useUserStore';
import { UserRoleEnum } from '@/shared/types/enumShared';

export function isAuthenticated() {
  const { user } = useUserStore.getState();
  return !!user;
}

export const authOptions: NextAuthOptions = {
  providers: [
    // Credentials provider for testing (when Google OAuth is not configured)
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        // Simple test credentials for development
        if (credentials?.email && credentials?.password) {
          return {
            id: '1',
            email: credentials.email,
            name: credentials.email.split('@')[0],
          };
        }
        return null;
      },
    }),
    // Keep Google provider but make it optional
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
  ],
  pages: {
    signIn: AUTH_ROUTES.SIGNIN,
  },
  callbacks: {
    async session({ session, token }) {
      if (token.sub) {
        session.user.id = token.sub;
      }
      // Get role from token (already set in jwt callback)
      session.user.role = token.role as UserRoleEnum;
      return session;
    },
    async jwt({ token, account, user }) {
      if (account) {
        token.id = account.providerAccountId;
      }

      // Create or get user role
      if (user?.email && !token.role) {
        let dbUser = await getUserByEmail(user.email);

        // If user doesn't exist, create with default CUSTOMER role
        if (!dbUser) {
          try {
            dbUser = await userService.create({
              email: user.email,
              name: user.name || user.email.split('@')[0],
              image: user.image || '',
              role: UserRoleEnum.CUSTOMER,
              isActive: true,
            });
          } catch {
            // Fallback to default role if creation fails
            token.role = UserRoleEnum.CUSTOMER;
            return token;
          }
        }

        token.role = dbUser.role;
      }

      return token;
    },
  },
};
