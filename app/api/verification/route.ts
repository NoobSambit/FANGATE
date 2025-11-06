import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getSpotifyData, calculateFanScore } from '@/lib/spotify';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findFirst({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
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
    return NextResponse.json(
      { error: error.message || 'Verification failed' },
      { status: 500 }
    );
  }
}
