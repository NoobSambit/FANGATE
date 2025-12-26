import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { battleId, participantId } = await req.json();

    if (!battleId || !participantId) {
      return NextResponse.json(
        { error: 'Battle ID and participant ID are required' },
        { status: 400 }
      );
    }

    // Find the participant
    const participant = await prisma.quizBattleParticipant.findFirst({
      where: {
        battleId,
        participantId,
      },
    });

    if (!participant) {
      return NextResponse.json(
        { error: 'Participant not found' },
        { status: 404 }
      );
    }

    // Mark participant as ready
    await prisma.quizBattleParticipant.update({
      where: { id: participant.id },
      data: { isReady: true },
    });

    // Check if all participants are ready
    const battle = await prisma.quizBattle.findUnique({
      where: { id: battleId },
      include: { participants: true },
    });

    if (!battle) {
      return NextResponse.json(
        { error: 'Battle not found' },
        { status: 404 }
      );
    }

    const allReady = battle.participants.every((p) => p.isReady);

    // If all participants are ready and battle hasn't started the timer yet
    if (allReady && battle.status === 'active' && !battle.actualStartTime) {
      await prisma.quizBattle.update({
        where: { id: battleId },
        data: { actualStartTime: new Date() },
      });
    }

    return NextResponse.json({
      success: true,
      allReady,
      actualStartTime: allReady ? new Date() : null,
    });
  } catch (error: any) {
    console.error('Mark ready error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to mark participant as ready' },
      { status: 500 }
    );
  }
}
