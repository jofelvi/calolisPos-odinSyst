import type { NextAuthOptions } from 'next-auth';
import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { getUserByEmail } from '@/services/firebase/userServices';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  pages: {
    signIn: '/public/login',
  },
  callbacks: {
    async session({ session, token }) {
      const dbUser = await getUserByEmail(session.user.email);
      if (token.sub) {
        session.user.id = token.sub;
      }
      session.user.role = dbUser?.role ?? 'customer';
      return session;
    },
    async jwt({ token, account }) {
      if (account) {
        token.id = account.providerAccountId;
      }
      return token;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
