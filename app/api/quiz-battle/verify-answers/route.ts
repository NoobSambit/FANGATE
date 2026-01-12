import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const battleId = searchParams.get('battleId');
    const participantId = searchParams.get('participantId');

    if (!battleId || !participantId) {
      return NextResponse.json(
        { error: 'Battle ID and participant ID are required' },
        { status: 400 }
      );
    }

    console.log('[VERIFY_ANSWERS] Checking answers for', { battleId, participantId });

    // Find the participant (using client-generated participantId)
    const participant = await prisma.quizBattleParticipant.findFirst({
      where: {
        battleId,
        participantId, // This is the client-generated UUID
      },
    });

    if (!participant) {
      console.error('[VERIFY_ANSWERS] Participant not found');
      return NextResponse.json(
        { error: 'Participant not found' },
        { status: 404 }
      );
    }

    // Count answers for this participant
    const answerCount = await prisma.quizBattleAnswer.count({
      where: {
        battleId,
        participantId: participant.id, // Use internal ID
      },
    });

    console.log('[VERIFY_ANSWERS] Found', answerCount, 'answers for participant');

    return NextResponse.json({
      answerCount,
      verified: answerCount > 0,
    });
  } catch (error: any) {
    console.error('[VERIFY_ANSWERS] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to verify answers' },
      { status: 500 }
    );
  }
}
