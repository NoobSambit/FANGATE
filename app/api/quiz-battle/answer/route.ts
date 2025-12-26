import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { battleId, participantId, questionId, answerIndex } = await req.json();

    console.log('[ANSWER] Submitting:', { battleId, participantId, questionId, answerIndex });

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

    // Check if battle is active or recently completed (allow answers during the transition period)
    if (battle.status !== 'active' && battle.status !== 'completed') {
      return NextResponse.json(
        { error: 'Battle is not active' },
        { status: 400 }
      );
    }

    // If battle is completed but was completed very recently (within last 5 seconds), allow submission
    if (battle.status === 'completed') {
      const completedAt = battle.completedAt ? new Date(battle.completedAt).getTime() : 0;
      const now = Date.now();
      const timeSinceCompletion = (now - completedAt) / 1000;

      if (timeSinceCompletion > 30) {
        console.log('[ANSWER] Battle completed', timeSinceCompletion, 'seconds ago, rejecting');
        return NextResponse.json(
          { error: 'Battle is not active' },
          { status: 400 }
        );
      }
      console.log('[ANSWER] Battle recently completed, allowing answer submission');
    }

    // Verify participant is in the battle
    const participant = battle.participants.find(
      (p) => p.participantId === participantId
    );

    console.log('[ANSWER] Battle participants:', battle.participants.map(p => p.participantId));
    console.log('[ANSWER] Looking for participant:', participantId);
    console.log('[ANSWER] Found participant:', participant ? participant.id : 'NOT FOUND');

    if (!participant) {
      return NextResponse.json(
        { error: 'Participant not found in this battle' },
        { status: 404 }
      );
    }

    console.log('[ANSWER] Battle questionIds:', battle.questionIds);
    console.log('[ANSWER] Checking for questionId:', questionId);
    console.log('[ANSWER] Question in battle?', battle.questionIds.includes(questionId));

    // Verify question is part of this battle
    if (!battle.questionIds.includes(questionId)) {
      console.error('[ANSWER] Question not in battle! Battle IDs:', battle.questionIds, 'Received:', questionId);
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

    console.log('[ANSWER] About to save answer:', {
      battleId,
      participantInternalId: participant.id,
      participantUUID: participant.participantId,
      questionId,
      answerIndex,
      isCorrect
    });

    // Use transaction to prevent race conditions in concurrent answer submissions
    const result = await prisma.$transaction(async (tx) => {
      // Check if answer already exists
      const existingAnswer = await tx.quizBattleAnswer.findUnique({
        where: {
          battleId_participantId_questionId: {
            battleId,
            participantId: participant.id,
            questionId,
          },
        },
      });

      let answer;
      if (existingAnswer) {
        // Update existing answer
        answer = await tx.quizBattleAnswer.update({
          where: { id: existingAnswer.id },
          data: {
            answerIndex,
            isCorrect,
          },
        });
      } else {
        // Create new answer
        answer = await tx.quizBattleAnswer.create({
          data: {
            battleId,
            participantId: participant.id,
            questionId,
            answerIndex,
            isCorrect,
          },
        });
      }

      // Recalculate score atomically within the same transaction
      const participantAnswers = await tx.quizBattleAnswer.findMany({
        where: {
          battleId,
          participantId: participant.id,
        },
      });

      const correctCount = participantAnswers.filter((a) => a.isCorrect).length;

      await tx.quizBattleParticipant.update({
        where: { id: participant.id },
        data: { score: correctCount },
      });

      return { answer, correctCount, wasUpdate: !!existingAnswer };
    });

    console.log('[ANSWER] Answer saved successfully:', {
      answerId: result.answer.id,
      wasUpdate: result.wasUpdate,
      newScore: result.correctCount
    });

    return NextResponse.json({
      answer: result.answer,
      isCorrect,
      currentScore: result.correctCount,
      message: result.wasUpdate ? 'Answer updated' : 'Answer submitted',
    });
  } catch (error: any) {
    console.error('Submit answer error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to submit answer' },
      { status: 500 }
    );
  }
}
