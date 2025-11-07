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
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
    async signIn({ user, account, profile }) {
      if (account?.provider === 'spotify' && profile) {
        const spotifyProfile = profile as any;
        
        await prisma.user.upsert({
          where: { spotifyId: account.providerAccountId },
          update: {
            email: spotifyProfile.email,
            displayName: spotifyProfile.display_name,
            image: spotifyProfile.images?.[0]?.url,
          },
          create: {
            spotifyId: account.providerAccountId,
            email: spotifyProfile.email,
            displayName: spotifyProfile.display_name,
            image: spotifyProfile.images?.[0]?.url,
          },
        });
      }
      return true;
    },
  },
  pages: {
    signIn: '/',
  },
  session: {
    strategy: 'database',
  },
  secret: process.env.NEXTAUTH_SECRET,
};
