import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getSpotifyData, calculateFanScore } from '@/lib/spotify';
import axios from 'axios';

const SPOTIFY_TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token';
const ENABLE_SPOTIFY_VERIFICATION =
  process.env.ENABLE_SPOTIFY_VERIFICATION === 'true';

async function refreshSpotifyAccessToken(account: any) {
  if (!account?.refresh_token) {
    throw new Error('Spotify access token expired and no refresh token is available. Please reconnect Spotify.');
  }

  const basicAuth = Buffer.from(
    `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
  ).toString('base64');

  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: account.refresh_token,
  });

  const response = await axios.post(
    SPOTIFY_TOKEN_ENDPOINT,
    params.toString(),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${basicAuth}`,
      },
    }
  );

  const data = response.data;
  const expiresAt = Math.floor(Date.now() / 1000) + (data.expires_in || 3600);

  await prisma.account.update({
    where: {
      provider_providerAccountId: {
        provider: 'spotify',
        providerAccountId: account.providerAccountId,
      },
    },
    data: {
      access_token: data.access_token,
      expires_at: expiresAt,
      ...(data.refresh_token ? { refresh_token: data.refresh_token } : {}),
      token_type: data.token_type ?? account.token_type,
      scope: data.scope ?? account.scope,
    },
  });

  return {
    accessToken: data.access_token as string,
    refreshToken: (data.refresh_token || account.refresh_token) as string,
    expiresAt,
  };
}

function isSpotifyUnauthorized(error: unknown) {
  return axios.isAxiosError(error) && error.response?.status === 401;
}

function buildMockSpotifyData() {
  const btsArtistImage =
    'https://i.scdn.co/image/ab6761610000e5eb0b68b0b3c3890c4f05d4953a';
  const jungkookImage =
    'https://i.scdn.co/image/ab6761610000e5eb63b4c6ebe97ed9869965e5c7';
  const mockAlbumImage =
    'https://i.scdn.co/image/ab67616d0000b2737b7b3898e0b0c12c643b8c07';

  return {
    topArtists: [
      {
        id: '3Nrfpe0tUJi4K4DXYWgMUX',
        name: 'BTS',
        images: [{ url: btsArtistImage }],
        external_urls: { spotify: 'https://open.spotify.com/artist/3Nrfpe0tUJi4K4DXYWgMUX' },
      },
      {
        id: '5KNNVgR6LBIABRIomyCEDJ',
        name: 'Jungkook',
        images: [{ url: jungkookImage }],
        external_urls: { spotify: 'https://open.spotify.com/artist/5KNNVgR6LBIABRIomyCEDJ' },
      },
      {
        id: '1uNFoZAHBGtllmzznpCI3s',
        name: 'Justin Bieber',
        images: [{ url: 'https://i.scdn.co/image/ab6761610000e5eba1767a8c163d4b9b82d40b8f' }],
        external_urls: { spotify: 'https://open.spotify.com/artist/1uNFoZAHBGtllmzznpCI3s' },
      },
    ],
    topTracks: [
      {
        id: '4saklk6nie3yiGePpBwUoc',
        name: 'Dynamite',
        artists: [
          { id: '3Nrfpe0tUJi4K4DXYWgMUX', name: 'BTS' },
        ],
        album: {
          name: 'Dynamite (DayTime Version)',
          images: [{ url: mockAlbumImage }],
        },
        external_urls: { spotify: 'https://open.spotify.com/track/4saklk6nie3yiGePpBwUoc' },
        preview_url: null,
      },
      {
        id: '2tRsMl4eGxwoNabM08Dm4I',
        name: 'Seven (feat. Latto)',
        artists: [
          { id: '5KNNVgR6LBIABRIomyCEDJ', name: 'Jungkook' },
          { id: '6S2OmqARrzebs0tKUEyXyp', name: 'Latto' },
        ],
        album: {
          name: 'Seven (feat. Latto)',
          images: [{ url: 'https://i.scdn.co/image/ab67616d0000b2730622346642f0eef0c64b69ec' }],
        },
        external_urls: { spotify: 'https://open.spotify.com/track/2tRsMl4eGxwoNabM08Dm4I' },
        preview_url: null,
      },
      {
        id: '2cZsWl3dFAgZ4KqA7E0Y2K',
        name: 'Take Two',
        artists: [
          { id: '3Nrfpe0tUJi4K4DXYWgMUX', name: 'BTS' },
        ],
        album: {
          name: 'Take Two',
          images: [{ url: 'https://i.scdn.co/image/ab67616d0000b273cb670c00a44b35de2b3287d3' }],
        },
        external_urls: { spotify: 'https://open.spotify.com/track/2cZsWl3dFAgZ4KqA7E0Y2K' },
        preview_url: null,
      },
    ],
    recentlyPlayed: Array.from({ length: 16 }).map((_, idx) => ({
      track: {
        id: `mock-track-${idx}`,
        name: idx % 2 === 0 ? 'Butter' : 'Life Goes On',
        artists: [
          { id: '3Nrfpe0tUJi4K4DXYWgMUX', name: 'BTS' },
        ],
        album: {
          name: 'BE',
          images: [{ url: mockAlbumImage }],
        },
        external_urls: { spotify: 'https://open.spotify.com/album/6nY6wLPXds3TyIeQQIviR6' },
        preview_url: null,
      },
      played_at: new Date(Date.now() - idx * 3600_000).toISOString(),
    })),
  };
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // With JWT strategy, session.user.id is the spotifyId or user id
    // Try to find user by email first, then by id (which might be spotifyId)
    let user = null;
    
    if (session.user.email) {
      user = await prisma.user.findFirst({
        where: { email: session.user.email },
      });
    }
    
    // If not found by email, try by ID (which might be spotifyId in JWT strategy)
    if (!user && session.user.id) {
      user = await prisma.user.findFirst({
        where: { 
          OR: [
            { id: session.user.id },
            { spotifyId: session.user.id },
          ],
        },
      });
    }

    if (!user) {
      return NextResponse.json({ 
        error: 'User not found. Please try logging in again.',
        details: 'User account may not have been created in database'
      }, { status: 404 });
    }

    let spotifyData;
    let fanScoreResult;
    let mockNotice: string | undefined;
    let usedMock = false;

    if (!ENABLE_SPOTIFY_VERIFICATION) {
      spotifyData = buildMockSpotifyData();
      fanScoreResult = calculateFanScore(spotifyData, new Date());
      usedMock = true;
      mockNotice =
        '⚠️ Spotify temporarily limits new apps. We’re showing a sample verification so you can keep going—thanks for understanding!';
    } else {
      const account = await prisma.account.findFirst({
        where: { userId: user.id, provider: 'spotify' },
      });

      if (!account || !account.access_token) {
        return NextResponse.json({ error: 'Spotify account not connected' }, { status: 400 });
      }

      let accessToken = account.access_token;
      const nowSeconds = Math.floor(Date.now() / 1000);

      if (account.expires_at && account.expires_at <= nowSeconds + 60) {
        try {
          const refreshed = await refreshSpotifyAccessToken(account);
          accessToken = refreshed.accessToken;
        } catch (refreshError) {
          console.error('Spotify token refresh failed (pre-fetch):', refreshError);
          return NextResponse.json(
            {
              error: 'Spotify session expired',
              details: 'Please reconnect your Spotify account.',
            },
            { status: 401 }
          );
        }
      }

      try {
        spotifyData = await getSpotifyData(accessToken);
      } catch (error) {
        if (isSpotifyUnauthorized(error)) {
          try {
            const refreshed = await refreshSpotifyAccessToken(account);
            accessToken = refreshed.accessToken;
            spotifyData = await getSpotifyData(accessToken);
          } catch (refreshError) {
            console.error('Spotify token refresh failed (after 401):', refreshError);
            return NextResponse.json(
              {
                error: 'Spotify session expired',
                details: 'Please reconnect your Spotify account.',
              },
              { status: 401 }
            );
          }
        } else {
          throw error;
        }
      }

      fanScoreResult = calculateFanScore(spotifyData, user.createdAt);
    }

    const verification = await prisma.verification.create({
      data: {
        userId: user.id,
        fanScore: fanScoreResult.totalScore,
        quizPassed: false,
      },
    });

    return NextResponse.json({
      verificationId: verification.id,
      fanScore: fanScoreResult.totalScore,
      breakdown: fanScoreResult.breakdown,
      details: fanScoreResult.details,
      canTakeQuiz: fanScoreResult.totalScore >= 70,
      recentListeningCount: fanScoreResult.breakdown.recentListeningCount || 0,
      mocked: usedMock,
      notice: mockNotice,
    });
  } catch (error: any) {
    console.error('Verification error:', error);
    console.error('Error details:', {
      message: error?.message,
      name: error?.name,
      code: error?.code,
      stack: error?.stack,
    });
    
    // Provide more helpful error messages
    let errorMessage = 'Verification failed';
    let errorDetails = '';
    
    if (error?.message?.includes("Can't reach database") || error?.message?.includes('database server')) {
      errorMessage = 'Database connection failed';
      errorDetails = 'Unable to connect to the database. Please check your database configuration and ensure the connection pooler is enabled.';
    } else if (error?.message?.includes('User not found')) {
      errorMessage = 'User account not found';
      errorDetails = 'Your account may not have been created properly. Please try logging in again.';
    } else if (error?.message?.includes('Spotify account not connected')) {
      errorMessage = 'Spotify account not connected';
      errorDetails = 'Unable to find your Spotify account. Please try logging in again.';
    } else if (error?.message) {
      errorMessage = error.message;
      errorDetails = error?.stack || '';
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: errorDetails,
        // Include more details in development
        ...(process.env.NODE_ENV === 'development' && {
          fullError: {
            message: error?.message,
            name: error?.name,
            code: error?.code,
          }
        })
      },
      { status: 500 }
    );
  }
}
