import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { QUIZ_BATTLE_CONFIG } from '@/lib/quiz-config';

export async function POST(req: NextRequest) {
  try {
    const { battleId, minimal } = await req.json();

    if (!battleId) {
      return NextResponse.json(
        { error: 'Battle ID is required' },
        { status: 400 }
      );
    }

    // Find battle (fetch participants only if not minimal, or if needed for "allFinished" check)
    // Actually we need participants for "allFinished" check.
    // But we can optimize what we RETURN.
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

    // Check if battle is active
    if (battle.status !== 'active') {
      return NextResponse.json({
        battle,
        message: 'Battle is already completed or not started',
      });
    }

    // Check if time has expired (use centralized config)
    // Use actualStartTime if set (when all players ready), otherwise don't count time yet
    const actualStart = battle.actualStartTime ? new Date(battle.actualStartTime).getTime() : null;
    const elapsed = actualStart ? Math.floor((Date.now() - actualStart) / 1000) : 0;
    const timeExpired = actualStart ? elapsed >= QUIZ_BATTLE_CONFIG.TIME_LIMIT_SECONDS : false;

    // Complete battle if time expired or all participants finished
    // Note: We consider a participant finished if they have 15 answers
    const totalQuestions = battle.questionIds.length;

    // Optimized: Use a single aggregation query instead of N separate count queries
    const answerCounts = await prisma.quizBattleAnswer.groupBy({
      by: ['participantId'],
      where: { battleId },
      _count: { participantId: true },
    });

    // Create a map of participant ID to answer count
    const answerCountMap = new Map(
      answerCounts.map((ac) => [ac.participantId, ac._count.participantId])
    );

    const participantsWithAnswers = battle.participants.map((p) => {
      const answerCount = answerCountMap.get(p.id) || 0;
      return {
        id: p.id,
        answerCount,
        finished: answerCount === totalQuestions,
      };
    });

    const allFinished = participantsWithAnswers.every((p) => p.finished);

    // Map participant finish status
    const participantsFinishStatus = participantsWithAnswers.map((p) => ({
      participantId: p.id,
      finished: p.finished,
    }));

    if (timeExpired || allFinished) {
      // Mark battle as completed
      const updatedBattle = await prisma.quizBattle.update({
        where: { id: battleId },
        data: {
          status: 'completed',
          completedAt: new Date(),
        },
        include: {
          participants: true,
        },
      });

      return NextResponse.json({
        battle: updatedBattle,
        completed: true,
        reason: timeExpired ? 'time_expired' : 'all_finished',
        participantsFinishStatus,
      });
    }

    const responsePayload: any = {
      completed: false,
      timeRemaining: Math.max(0, QUIZ_BATTLE_CONFIG.TIME_LIMIT_SECONDS - elapsed),
      participantsFinishStatus,
    };

    if (!minimal) {
      responsePayload.battle = battle;
    } else {
      // Return minimal battle info needed for status check
      responsePayload.battle = {
        id: battle.id,
        status: battle.status,
        actualStartTime: battle.actualStartTime,
      };
    }

    return NextResponse.json(responsePayload);
  } catch (error: any) {
    console.error('Complete battle error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to complete battle' },
      { status: 500 }
    );
  }
}
