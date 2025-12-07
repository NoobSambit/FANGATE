import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { battleId } = await req.json();

    if (!battleId) {
      return NextResponse.json(
        { error: 'Battle ID is required' },
        { status: 400 }
      );
    }

    // Find battle with all related data
    const battle = await prisma.quizBattle.findUnique({
      where: { id: battleId },
      include: {
        participants: {
          orderBy: {
            score: 'desc',
          },
          include: {
            answers: true,
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

    // Get all questions for this battle and preserve order
    const fetchedQuestions = await prisma.quizQuestion.findMany({
      where: {
        id: {
          in: battle.questionIds,
        },
      },
    });

    // Create a map of question ID to question
    const questionMap = new Map(fetchedQuestions.map((q) => [q.id, q]));

    console.log('[RESULTS] Battle question IDs:', battle.questionIds);

    // Build detailed results for each participant
    const participantResults = battle.participants.map((participant) => {
      console.log(`[RESULTS] Building results for ${participant.nickname}, answers count:`, participant.answers.length);
      const questionResults = battle.questionIds.map((questionId) => {
        const answer = participant.answers.find((a) => a.questionId === questionId);
        const question = questionMap.get(questionId);

        return {
          questionId,
          question: question?.question || '',
          options: question?.options || [],
          correctIndex: question?.correctIndex ?? -1,
          userAnswer: answer?.answerIndex ?? -1,
          isCorrect: answer?.isCorrect ?? false,
          answered: !!answer,
        };
      });

      return {
        participantId: participant.participantId,
        nickname: participant.nickname,
        isHost: participant.isHost,
        score: participant.score,
        totalQuestions: battle.questionIds.length,
        percentage: Math.round((participant.score / battle.questionIds.length) * 100),
        questionResults,
      };
    });

    // Determine winner(s)
    const maxScore = Math.max(...battle.participants.map((p) => p.score));
    const winners = participantResults.filter((p) => p.score === maxScore);

    // Mark battle as completed if not already
    if (battle.status === 'active') {
      await prisma.quizBattle.update({
        where: { id: battleId },
        data: {
          status: 'completed',
          completedAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      battleId: battle.id,
      accessCode: battle.accessCode,
      status: 'completed',
      participantResults,
      winners,
      totalQuestions: battle.questionIds.length,
    });
  } catch (error: any) {
    console.error('Get battle results error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get battle results' },
      { status: 500 }
    );
  }
}
