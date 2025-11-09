import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getSpotifyData, calculateFanScore } from '@/lib/spotify';

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

    const account = await prisma.account.findFirst({
      where: { userId: user.id, provider: 'spotify' },
    });

    if (!account || !account.access_token) {
      return NextResponse.json({ error: 'Spotify account not connected' }, { status: 400 });
    }

    const spotifyData = await getSpotifyData(account.access_token);
    const fanScore = calculateFanScore(spotifyData, user.createdAt);

    const verification = await prisma.verification.create({
      data: {
        userId: user.id,
        fanScore,
        quizPassed: false,
      },
    });

    return NextResponse.json({
      verificationId: verification.id,
      fanScore,
      canTakeQuiz: fanScore >= 70,
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
