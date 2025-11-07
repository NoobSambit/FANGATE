import { NextAuthOptions } from 'next-auth';
import SpotifyProvider from 'next-auth/providers/spotify';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from './prisma';

const SPOTIFY_SCOPES = [
  'user-read-email',
  'user-read-private',
  'user-top-read',
  'user-read-recently-played'
].join(' ');

// Validate required environment variables
if (!process.env.SPOTIFY_CLIENT_ID) {
  throw new Error('SPOTIFY_CLIENT_ID is not set in environment variables');
}
if (!process.env.SPOTIFY_CLIENT_SECRET) {
  throw new Error('SPOTIFY_CLIENT_SECRET is not set in environment variables');
}
if (!process.env.NEXTAUTH_SECRET) {
  throw new Error('NEXTAUTH_SECRET is not set in environment variables');
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    SpotifyProvider({
      clientId: process.env.SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
      authorization: {
        params: { 
          scope: SPOTIFY_SCOPES,
        },
      },
    }),
  ],
  callbacks: {
    async session({ session, token, user }) {
      // For JWT strategy, use token; for database strategy, use user
      if (session.user) {
        session.user.id = (token?.sub as string) || (user?.id as string) || '';
      }
      return session;
    },
    async signIn({ user, account, profile }) {
      // PrismaAdapter handles user/account creation automatically
      // No need to manually create/update user here
      return true;
    },
    async jwt({ token, user, account, profile }) {
      // Store user ID in token for JWT strategy
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
  },
  pages: {
    signIn: '/',
  },
  session: {
    strategy: 'jwt', // Temporarily using JWT to test if database is the issue
  },
  secret: process.env.NEXTAUTH_SECRET,
};
