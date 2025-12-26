import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getLastfmData, calculateFanScore, buildMockLastfmData } from '@/lib/lastfm';

const ENABLE_LASTFM_VERIFICATION =
  process.env.ENABLE_LASTFM_VERIFICATION !== 'false'; // Enabled by default

/**
 * POST /api/verification/lastfm
 * Verify user's BTS fandom using their Last.fm data
 * Requires username in request body
 */
export async function POST(req: NextRequest) {
  try {
    const { username } = await req.json();

    if (!username || typeof username !== 'string') {
      return NextResponse.json(
        { error: 'Last.fm username is required' },
        { status: 400 }
      );
    }

    const mockMode = !ENABLE_LASTFM_VERIFICATION;
    let lastfmData;
    let fanScoreResult;
    let mockNotice: string | undefined;
    let usedMock = false;

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { lastfmUsername: username.toLowerCase() },
    });

    if (!user) {
      // User hasn't connected their Last.fm yet
      return NextResponse.json(
        { error: 'User not found. Please connect your Last.fm account first.' },
        { status: 404 }
      );
    }

    if (mockMode) {
      // Use mock data for testing
      lastfmData = buildMockLastfmData();
      fanScoreResult = calculateFanScore(lastfmData);
      usedMock = true;
      mockNotice =
        '⚠️ Using mock Last.fm data for testing. Enable ENABLE_LASTFM_VERIFICATION to use real data.';
    } else {
      // Fetch real Last.fm data
      try {
        lastfmData = await getLastfmData(username);
        fanScoreResult = calculateFanScore(lastfmData);
      } catch (error: any) {
        console.error('Last.fm data fetch error:', error);
        return NextResponse.json(
          {
            error: 'Failed to fetch Last.fm data',
            details: error.message || 'Please ensure your Last.fm profile is public.',
          },
          { status: 500 }
        );
      }
    }

    // Save verification result
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
      mocked: usedMock,
      notice: mockNotice,
    });
  } catch (error: any) {
    console.error('Verification error:', {
      error,
      message: error?.message,
      name: error?.name,
      code: error?.code,
      stack: error?.stack,
    });

    let errorMessage = 'Verification failed';
    let errorDetails = '';

    if (error?.message?.includes("Can't reach database") || error?.message?.includes('database server')) {
      errorMessage = 'Database connection failed';
      errorDetails = 'Unable to connect to the database. Please check your database configuration.';
    } else if (error?.message?.includes('User not found')) {
      errorMessage = 'User account not found';
      errorDetails = 'Please connect your Last.fm account first.';
    } else if (error?.message) {
      errorMessage = error.message;
      errorDetails = error?.stack || '';
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: errorDetails,
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
