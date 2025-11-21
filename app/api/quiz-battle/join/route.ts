import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { accessCode, participantId, nickname } = await req.json();

    if (!accessCode || !participantId || !nickname) {
      return NextResponse.json(
        { error: 'Access code, participant ID, and nickname are required' },
        { status: 400 }
      );
    }

    // Find battle by access code
    const battle = await prisma.quizBattle.findUnique({
      where: { accessCode: accessCode.toUpperCase() },
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

    // Check if battle has already started
    if (battle.status !== 'waiting') {
      return NextResponse.json(
        { error: 'Battle has already started' },
        { status: 400 }
      );
    }

    // Check if participant already joined
    const existingParticipant = battle.participants.find(
      (p) => p.participantId === participantId
    );

    if (existingParticipant) {
      return NextResponse.json({
        battleId: battle.id,
        battle,
        message: 'Already joined',
      });
    }

    // Check if battle is full
    if (battle.participants.length >= battle.maxPlayers) {
      return NextResponse.json(
        { error: 'Battle is full' },
        { status: 400 }
      );
    }

    // Add participant to battle
    const updatedBattle = await prisma.quizBattle.update({
      where: { id: battle.id },
      data: {
        participants: {
          create: {
            participantId,
            nickname,
            isHost: false,
          },
        },
      },
      include: {
        participants: true,
      },
    });

    return NextResponse.json({
      battleId: updatedBattle.id,
      battle: updatedBattle,
    });
  } catch (error: any) {
    console.error('Join battle error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to join battle' },
      { status: 500 }
    );
  }
}
