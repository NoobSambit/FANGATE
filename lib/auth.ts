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
  // Temporarily disabled adapter to test if it's causing the issue
  // adapter: PrismaAdapter(prisma),
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
      // Without adapter, manually create user and account in database
      if (account?.provider === 'spotify' && profile) {
        try {
          const spotifyProfile = profile as any;
          
          // Create or update user
          const dbUser = await prisma.user.upsert({
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
          
          // Create or update account with access token
          await prisma.account.upsert({
            where: {
              provider_providerAccountId: {
                provider: account.provider,
                providerAccountId: account.providerAccountId,
              },
            },
            update: {
              access_token: account.access_token,
              refresh_token: account.refresh_token,
              expires_at: account.expires_at,
              token_type: account.token_type,
              scope: account.scope,
            },
            create: {
              userId: dbUser.id,
              type: account.type,
              provider: account.provider,
              providerAccountId: account.providerAccountId,
              access_token: account.access_token,
              refresh_token: account.refresh_token,
              expires_at: account.expires_at,
              token_type: account.token_type,
              scope: account.scope,
            },
          });
        } catch (error: any) {
          console.error('User/Account creation error:', error);
          // Don't block sign-in, but log the error
        }
      }
      return true;
    },
    async jwt({ token, user, account, profile }) {
      // Store user ID in token for JWT strategy
      if (user) {
        token.sub = user.id || account?.providerAccountId || '';
      } else if (account?.providerAccountId) {
        // If no user object, use providerAccountId
        token.sub = account.providerAccountId;
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
