import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Get all question IDs first
    const allQuestions = await prisma.quizQuestion.findMany({
      select: { id: true },
    });

    if (allQuestions.length === 0) {
      return NextResponse.json({ error: 'No questions available' }, { status: 404 });
    }

    // Shuffle and select 10 random questions
    const shuffled = allQuestions.sort(() => Math.random() - 0.5);
    const selectedIds = shuffled.slice(0, Math.min(10, allQuestions.length)).map(q => q.id);

    // Fetch the selected questions
    const questions = await prisma.quizQuestion.findMany({
      where: {
        id: {
          in: selectedIds,
        },
      },
    });

    // Shuffle the order of questions again for extra randomization
    const randomizedQuestions = questions.sort(() => Math.random() - 0.5);

    // Remove correctIndex before sending to client
    const sanitizedQuestions = randomizedQuestions.map(({ correctIndex, ...q }) => q);

    return NextResponse.json(sanitizedQuestions);
  } catch (error) {
    console.error('Quiz fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch quiz' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findFirst({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { answers, questionIds, verificationId } = await req.json();

    if (!questionIds || !Array.isArray(questionIds) || questionIds.length !== 10) {
      return NextResponse.json({ error: 'Invalid question IDs' }, { status: 400 });
    }

    if (!answers || !Array.isArray(answers) || answers.length !== 10) {
      return NextResponse.json({ error: 'Invalid answers' }, { status: 400 });
    }

    if (verificationId) {
      const verification = await prisma.verification.findUnique({
        where: { id: verificationId },
      });

      if (!verification) {
        return NextResponse.json({ error: 'Verification not found' }, { status: 404 });
      }

      if (verification.userId !== user.id) {
        return NextResponse.json({ error: 'Forbidden: Verification does not belong to you' }, { status: 403 });
      }
    }

    // Fetch questions by their IDs to match answers correctly
    const questions = await prisma.quizQuestion.findMany({
      where: {
        id: {
          in: questionIds,
        },
      },
    });

    // Create a map of question ID to question for quick lookup
    const questionMap = new Map(questions.map(q => [q.id, q]));

    // Build result with questions, user answers, and correctness
    const questionResults = questionIds.map((questionId: string, index: number) => {
      const question = questionMap.get(questionId);
      const userAnswer = answers[index];
      const isCorrect = question ? question.correctIndex === userAnswer : false;
      
      return {
        id: questionId,
        question: question?.question || '',
        options: question?.options || [],
        correctIndex: question?.correctIndex ?? -1,
        userAnswer: userAnswer,
        isCorrect: isCorrect,
      };
    });

    const correctCount = questionResults.filter(r => r.isCorrect).length;
    const score = correctCount;
    const passed = score >= 7;

    await prisma.quizAttempt.create({
      data: {
        userId: user.id,
        score,
      },
    });

    // Update verification status
    if (verificationId) {
      await prisma.verification.update({
        where: { id: verificationId },
        data: {
          quizPassed: passed,
          verifiedAt: passed ? new Date() : undefined,
        },
      });
    }

    return NextResponse.json({
      score,
      passed,
      correctCount,
      totalQuestions: 10,
      questions: questionResults,
    });
  } catch (error: any) {
    console.error('Quiz submission error:', error);
    return NextResponse.json(
      { error: error.message || 'Quiz submission failed' },
      { status: 500 }
    );
  }
}
