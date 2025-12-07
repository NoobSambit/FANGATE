import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { battleId, hostId } = await req.json();

    if (!battleId || !hostId) {
      return NextResponse.json(
        { error: 'Battle ID and host ID are required' },
        { status: 400 }
      );
    }

    // Find battle
    const battle = await prisma.quizBattle.findUnique({
      where: { id: battleId },
      include: {
        participants: true,
      },
    });

    if (!battle) {
      return NextResponse.json(
        { error: 'Battle not found' },
        { status: 404 }
      );
    }

    // Verify the requester is the host
    const host = battle.participants.find((p) => p.isHost);
    if (!host || host.participantId !== hostId) {
      return NextResponse.json(
        { error: 'Only the host can start the battle' },
        { status: 403 }
      );
    }

    // Check if battle is already started
    if (battle.status !== 'waiting') {
      return NextResponse.json(
        { error: 'Battle has already started' },
        { status: 400 }
      );
    }

    // Check minimum participants (at least 2)
    if (battle.participants.length < 2) {
      return NextResponse.json(
        { error: 'Need at least 2 participants to start' },
        { status: 400 }
      );
    }

    // Start battle
    const updatedBattle = await prisma.quizBattle.update({
      where: { id: battleId },
      data: {
        status: 'active',
        startedAt: new Date(),
      },
      include: {
        participants: true,
      },
    });

    return NextResponse.json({
      battle: updatedBattle,
      message: 'Battle started',
    });
  } catch (error: any) {
    console.error('Start battle error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to start battle' },
      { status: 500 }
    );
  }
}
