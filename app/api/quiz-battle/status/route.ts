import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const battleId = searchParams.get('battleId');

    if (!battleId) {
      return NextResponse.json(
        { error: 'Battle ID is required' },
        { status: 400 }
      );
    }

    // Get battle with participants
    const battle = await prisma.quizBattle.findUnique({
      where: { id: battleId },
      include: {
        participants: {
          orderBy: {
            score: 'desc',
          },
        },
      },
    });

    if (!battle) {
      return NextResponse.json(
        { error: 'Battle not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      battle,
      participantCount: battle.participants.length,
      status: battle.status,
    });
  } catch (error: any) {
    console.error('Get battle status error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get battle status' },
      { status: 500 }
    );
  }
}
