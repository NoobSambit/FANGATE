import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const ENABLE_SPOTIFY_VERIFICATION =
  process.env.ENABLE_SPOTIFY_VERIFICATION === 'true';

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
    const mockMode = !ENABLE_SPOTIFY_VERIFICATION;

    let user: any = null;
    if (session?.user?.email) {
      user = await prisma.user.findFirst({
        where: { email: session.user.email },
      });
    }

    if (!user && ENABLE_SPOTIFY_VERIFICATION) {
      if (!session?.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { answers, questionIds, verificationId, spotifyScore: providedSpotifyScore } = await req.json();

    if (!questionIds || !Array.isArray(questionIds) || questionIds.length !== 10) {
      return NextResponse.json({ error: 'Invalid question IDs' }, { status: 400 });
    }

    if (!answers || !Array.isArray(answers) || answers.length !== 10) {
      return NextResponse.json({ error: 'Invalid answers' }, { status: 400 });
    }

    if (verificationId && ENABLE_SPOTIFY_VERIFICATION) {
      const verification = await prisma.verification.findUnique({
        where: { id: verificationId },
      });

      if (!verification) {
        return NextResponse.json({ error: 'Verification not found' }, { status: 404 });
      }

      if (!user || verification.userId !== user.id) {
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
    const quizScore = correctCount;
    const quizPercentage = (quizScore / 10) * 100;
    const quizPassed = quizScore >= 7; // Quiz itself passed (7/10)

    // Get Spotify fan score and breakdown from verification
    let spotifyScore = 0;
    if (ENABLE_SPOTIFY_VERIFICATION && verificationId) {
      const verification = await prisma.verification.findUnique({
        where: { id: verificationId },
        select: { 
          fanScore: true,
          // We'll need to fetch the breakdown from the verification data
          // For now, we'll calculate it or store it separately
        },
      });
      if (verification) {
        spotifyScore = verification.fanScore;
      }
    } else if (!ENABLE_SPOTIFY_VERIFICATION) {
      spotifyScore = Number(providedSpotifyScore) || 0;
    }

    // Calculate combined score: Spotify (40%) + Quiz (60%)
    // Quiz score is weighted more as requested
    const combinedScore = Math.round((spotifyScore * 0.4) + (quizPercentage * 0.6));
    const overallPassed = combinedScore >= 70;

    if (ENABLE_SPOTIFY_VERIFICATION && user) {
      await prisma.quizAttempt.create({
        data: {
          userId: user.id,
          score: quizScore,
        },
      });

      // Update verification status based on combined score
      if (verificationId) {
        await prisma.verification.update({
          where: { id: verificationId },
          data: {
            quizPassed: overallPassed, // Use combined score result
            verifiedAt: overallPassed ? new Date() : undefined,
          },
        });
      }
    }

    return NextResponse.json({
      score: quizScore,
      quizPassed, // Whether quiz itself passed (7/10)
      overallPassed, // Whether combined score passed (>=70)
      spotifyScore,
      quizPercentage,
      combinedScore,
      correctCount,
      totalQuestions: 10,
      questions: questionResults,
      mocked: !ENABLE_SPOTIFY_VERIFICATION,
    });
  } catch (error: any) {
    console.error('Quiz submission error:', error);
    return NextResponse.json(
      { error: error.message || 'Quiz submission failed' },
      { status: 500 }
    );
  }
}
