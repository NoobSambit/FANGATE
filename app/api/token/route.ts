import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { SignJWT } from 'jose';

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

    const { verificationId } = await req.json();

    const verification = await prisma.verification.findUnique({
      where: { id: verificationId },
      include: { user: true },
    });

    if (!verification) {
      return NextResponse.json({ error: 'Verification not found' }, { status: 404 });
    }

    if (verification.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden: Verification does not belong to you' }, { status: 403 });
    }

    if (!verification.quizPassed) {
      return NextResponse.json({ error: 'Quiz not passed' }, { status: 400 });
    }

    if (!process.env.NEXTAUTH_SECRET) {
      throw new Error('NEXTAUTH_SECRET must be set for secure token generation');
    }

    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET);

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const token = await new SignJWT({
      userId: verification.userId,
      verificationId: verification.id,
      fanScore: verification.fanScore,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('10m')
      .sign(secret);

    await prisma.verification.update({
      where: { id: verificationId },
      data: {
        passToken: token,
        tokenExpiresAt: expiresAt,
      },
    });

    return NextResponse.json({ token });
  } catch (error: any) {
    console.error('Token generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Token generation failed' },
      { status: 500 }
    );
  }
}
