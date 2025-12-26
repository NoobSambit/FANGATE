import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateLastfmUsername, getLastfmUserInfo } from '@/lib/lastfm';

/**
 * POST /api/auth/lastfm
 * Authenticate user with Last.fm username
 * Creates or retrieves user account based on Last.fm username
 */
export async function POST(request: NextRequest) {
  try {
    const { username } = await request.json();

    if (!username || typeof username !== 'string') {
      return NextResponse.json(
        { error: 'Last.fm username is required' },
        { status: 400 }
      );
    }

    // Validate username exists on Last.fm
    const isValid = await validateLastfmUsername(username);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Last.fm username not found or profile is private' },
        { status: 404 }
      );
    }

    // Get user info from Last.fm
    const userInfo = await getLastfmUserInfo(username);

    // Create or update user in database
    const user = await prisma.user.upsert({
      where: { lastfmUsername: username.toLowerCase() },
      update: {
        displayName: userInfo.realname || username,
        image: userInfo.image?.find(img => img.size === 'large')?.[`#text`] || null,
      },
      create: {
        lastfmUsername: username.toLowerCase(),
        displayName: userInfo.realname || username,
        image: userInfo.image?.find(img => img.size === 'large')?.[`#text`] || null,
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.lastfmUsername,
        displayName: user.displayName,
        image: user.image,
        createdAt: user.createdAt,
      },
    });
  } catch (error: any) {
    console.error('Last.fm authentication error:', error);
    return NextResponse.json(
      { error: 'Failed to authenticate with Last.fm', details: error.message },
      { status: 500 }
    );
  }
}
