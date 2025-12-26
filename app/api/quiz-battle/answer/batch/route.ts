import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { battleId, participantId, answers } = await req.json();

    console.log('[ANSWER_BATCH] Submitting batch:', { battleId, participantId, count: answers ? Object.keys(answers).length : 0 });

    if (!battleId || !participantId || !answers) {
      return NextResponse.json(
        { error: 'Battle ID, participant ID, and answers are required' },
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

    // Check if battle is active or recently completed
    if (battle.status !== 'active' && battle.status !== 'completed') {
      return NextResponse.json(
        { error: 'Battle is not active' },
        { status: 400 }
      );
    }

    // Grace period check for completed battles
    if (battle.status === 'completed') {
      const completedAt = battle.completedAt ? new Date(battle.completedAt).getTime() : 0;
      const now = Date.now();
      const timeSinceCompletion = (now - completedAt) / 1000;

      // Allow 30 seconds grace period for batch submissions
      if (timeSinceCompletion > 30) {
        console.log('[ANSWER_BATCH] Battle completed', timeSinceCompletion, 'seconds ago, rejecting');
        return NextResponse.json(
          { error: 'Battle is not active' },
          { status: 400 }
        );
      }
      console.log('[ANSWER_BATCH] Battle recently completed, allowing batch submission');
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

    // Fetch all questions involved
    const questionIds = Object.keys(answers);
    
    // Verify all questions are part of the battle
    const invalidQuestions = questionIds.filter(qid => !battle.questionIds.includes(qid));
    if (invalidQuestions.length > 0) {
      console.warn('[ANSWER_BATCH] Ignoring answers for questions not in battle:', invalidQuestions);
      // We'll proceed but only with valid questions
    }

    const validQuestionIds = questionIds.filter(qid => battle.questionIds.includes(qid));
    
    if (validQuestionIds.length === 0) {
       return NextResponse.json(
        { error: 'No valid questions provided' },
        { status: 400 }
      );
    }

    const questions = await prisma.quizQuestion.findMany({
      where: {
        id: {
          in: validQuestionIds
        }
      }
    });

    const questionMap = new Map(questions.map(q => [q.id, q]));

    // Transaction to save all answers
    const result = await prisma.$transaction(async (tx) => {
      // 1. Prepare data for createMany
      const answersToCreate = [];
      let correctCountInBatch = 0;

      for (const questionId of validQuestionIds) {
        const answerIndex = answers[questionId];
        const question = questionMap.get(questionId);
        
        if (!question) continue;

        const isCorrect = question.correctIndex === answerIndex;
        if (isCorrect) correctCountInBatch++;

        answersToCreate.push({
            battleId,
            participantId: participant.id,
            questionId,
            answerIndex,
            isCorrect,
        });
      }

      // 2. Delete existing answers for these questions (efficiently handling "upsert")
      // Note: We only delete answers for the questions we are about to insert
      await tx.quizBattleAnswer.deleteMany({
        where: {
          battleId,
          participantId: participant.id,
          questionId: {
            in: validQuestionIds
          }
        }
      });

      // 3. Create new answers in bulk
      if (answersToCreate.length > 0) {
        await tx.quizBattleAnswer.createMany({
          data: answersToCreate,
        });
      }

      // 4. Calculate total score
      // Since we just updated the answers, we can query the count directly
      const countResult = await tx.quizBattleAnswer.count({
        where: {
          battleId,
          participantId: participant.id,
          isCorrect: true
        }
      });

      // 5. Update participant score
      await tx.quizBattleParticipant.update({
        where: { id: participant.id },
        data: { score: countResult },
      });

      return { totalCorrect: countResult, processed: validQuestionIds.length };
    }, {
      timeout: 10000 // Increase timeout to 10 seconds
    });

    console.log('[ANSWER_BATCH] Batch processed successfully:', result);

    return NextResponse.json({
      success: true,
      currentScore: result.totalCorrect,
      processedCount: result.processed
    });

  } catch (error: any) {
    console.error('Submit batch answer error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to submit answers' },
      { status: 500 }
    );
  }
}

