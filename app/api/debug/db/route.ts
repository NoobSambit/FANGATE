import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Test database connection
    await prisma.$connect();
    
    // Try a simple query
    const userCount = await prisma.user.count();
    
    // Test if we can query
    const testQuery = await prisma.$queryRaw`SELECT 1 as test`;
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      userCount,
      testQuery,
      databaseUrl: process.env.DATABASE_URL ? 'Set (hidden)' : 'Not set',
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
      name: error.name,
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

