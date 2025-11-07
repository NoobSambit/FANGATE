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
      try {
        if (account?.provider === 'spotify' && profile) {
          const spotifyProfile = profile as any;
          
          // Try to upsert user, but don't fail if it errors (PrismaAdapter handles user creation)
          try {
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
          } catch (dbError: any) {
            // Log database errors but don't block sign-in
            // PrismaAdapter will handle user/account creation
            console.error('User upsert error (non-blocking):', dbError?.message || dbError);
          }
        }
        return true;
      } catch (error: any) {
        console.error('SignIn callback error:', error?.message || error);
        // Return true to allow sign-in to proceed even if callback fails
        // The PrismaAdapter will handle the database operations
        return true;
      }
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
