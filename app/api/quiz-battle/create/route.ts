import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Generate a random 6-character access code
function generateAccessCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed ambiguous chars
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function POST(req: NextRequest) {
  try {
    const { hostId, nickname } = await req.json();

    if (!hostId || !nickname) {
      return NextResponse.json(
        { error: 'Host ID and nickname are required' },
        { status: 400 }
      );
    }

    // Generate unique access code with retry limit to prevent infinite loops
    let accessCode = generateAccessCode();
    let existing = await prisma.quizBattle.findUnique({
      where: { accessCode },
    });

    // Regenerate if code already exists (max 10 attempts)
    let attempts = 0;
    while (existing && attempts < 10) {
      accessCode = generateAccessCode();
      existing = await prisma.quizBattle.findUnique({
        where: { accessCode },
      });
      attempts++;
    }

    if (existing) {
      // Extremely unlikely with 30^6 = 729 million possible codes
      return NextResponse.json(
        { error: 'Unable to generate unique access code. Please try again.' },
        { status: 500 }
      );
    }

    // Get 15 random questions
    const allQuestions = await prisma.quizQuestion.findMany({
      select: { id: true },
    });

    if (allQuestions.length < 15) {
      return NextResponse.json(
        { error: 'Not enough questions available (need at least 15)' },
        { status: 500 }
      );
    }

    const shuffled = allQuestions.sort(() => Math.random() - 0.5);
    const questionIds = shuffled.slice(0, 15).map((q) => q.id);

    // Create battle
    const battle = await prisma.quizBattle.create({
      data: {
        accessCode,
        hostId,
        questionIds,
        status: 'waiting',
        participants: {
          create: {
            participantId: hostId,
            nickname,
            isHost: true,
          },
        },
      },
      include: {
        participants: true,
      },
    });

    return NextResponse.json({
      battleId: battle.id,
      accessCode: battle.accessCode,
      battle,
    });
  } catch (error: any) {
    console.error('Create battle error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create battle' },
      { status: 500 }
    );
  }
}
