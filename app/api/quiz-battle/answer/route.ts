import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { battleId, participantId, questionId, answerIndex } = await req.json();

    if (battleId === undefined || participantId === undefined ||
        questionId === undefined || answerIndex === undefined) {
      return NextResponse.json(
        { error: 'Battle ID, participant ID, question ID, and answer index are required' },
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

    // Check if battle is active
    if (battle.status !== 'active') {
      return NextResponse.json(
        { error: 'Battle is not active' },
        { status: 400 }
      );
    }

    // Verify participant is in the battle
    const participant = battle.participants.find(
      (p) => p.participantId === participantId
    );

    if (!participant) {
      return NextResponse.json(
        { error: 'Participant not found in this battle' },
        { status: 404 }
      );
    }

    // Verify question is part of this battle
    if (!battle.questionIds.includes(questionId)) {
      return NextResponse.json(
        { error: 'Question not part of this battle' },
        { status: 400 }
      );
    }

    // Get the correct answer
    const question = await prisma.quizQuestion.findUnique({
      where: { id: questionId },
    });

    if (!question) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    const isCorrect = question.correctIndex === answerIndex;

    // Check if answer already exists
    const existingAnswer = await prisma.quizBattleAnswer.findUnique({
      where: {
        battleId_participantId_questionId: {
          battleId,
          participantId: participant.id,
          questionId,
        },
      },
    });

    if (existingAnswer) {
      // Update existing answer
      const answer = await prisma.quizBattleAnswer.update({
        where: { id: existingAnswer.id },
        data: {
          answerIndex,
          isCorrect,
        },
      });

      return NextResponse.json({
        answer,
        isCorrect,
        message: 'Answer updated',
      });
    }

    // Create new answer
    const answer = await prisma.quizBattleAnswer.create({
      data: {
        battleId,
        participantId: participant.id,
        questionId,
        answerIndex,
        isCorrect,
      },
    });

    // Update participant score
    const participantAnswers = await prisma.quizBattleAnswer.findMany({
      where: {
        battleId,
        participantId: participant.id,
      },
    });

    const correctCount = participantAnswers.filter((a) => a.isCorrect).length;

    await prisma.quizBattleParticipant.update({
      where: { id: participant.id },
      data: { score: correctCount },
    });

    return NextResponse.json({
      answer,
      isCorrect,
      currentScore: correctCount,
    });
  } catch (error: any) {
    console.error('Submit answer error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to submit answer' },
      { status: 500 }
    );
  }
}
