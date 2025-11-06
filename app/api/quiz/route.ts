import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const questions = await prisma.quizQuestion.findMany({
      take: 10,
      orderBy: {
        createdAt: 'asc',
      },
    });

    const sanitizedQuestions = questions.map(({ correctIndex, ...q }) => q);

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

    const { answers, verificationId } = await req.json();

    const questions = await prisma.quizQuestion.findMany({
      take: 10,
      orderBy: {
        createdAt: 'asc',
      },
    });

    let correctCount = 0;
    answers.forEach((answer: number, index: number) => {
      if (questions[index] && questions[index].correctIndex === answer) {
        correctCount++;
      }
    });

    const score = correctCount;
    const passed = score >= 7;

    await prisma.quizAttempt.create({
      data: {
        userId: user.id,
        score,
      },
    });

    if (passed && verificationId) {
      await prisma.verification.update({
        where: { id: verificationId },
        data: {
          quizPassed: true,
          verifiedAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      score,
      passed,
      correctCount,
      totalQuestions: 10,
    });
  } catch (error: any) {
    console.error('Quiz submission error:', error);
    return NextResponse.json(
      { error: error.message || 'Quiz submission failed' },
      { status: 500 }
    );
  }
}
