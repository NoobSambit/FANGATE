import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const results: any = {
    timestamp: new Date().toISOString(),
    databaseUrl: process.env.DATABASE_URL ? 'Set' : 'Not set',
    databaseUrlPreview: process.env.DATABASE_URL 
      ? process.env.DATABASE_URL.substring(0, 30) + '...' 
      : 'Not set',
    tests: [],
  };

  // Test 1: Basic connection
  try {
    await prisma.$connect();
    results.tests.push({ name: 'Connection', status: 'success', message: 'Connected successfully' });
  } catch (error: any) {
    results.tests.push({ 
      name: 'Connection', 
      status: 'failed', 
      message: error.message,
      error: error.code || error.name,
    });
    return NextResponse.json(results, { status: 500 });
  }

  // Test 2: Query database
  try {
    const userCount = await prisma.user.count();
    results.tests.push({ 
      name: 'Query', 
      status: 'success', 
      message: `Found ${userCount} users` 
    });
  } catch (error: any) {
    results.tests.push({ 
      name: 'Query', 
      status: 'failed', 
      message: error.message,
    });
  }

  // Test 3: Check tables
  try {
    const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    `;
    results.tests.push({ 
      name: 'Tables', 
      status: 'success', 
      message: `Found ${tables.length} tables`,
      tables: tables.map(t => t.tablename),
    });
  } catch (error: any) {
    results.tests.push({ 
      name: 'Tables', 
      status: 'failed', 
      message: error.message,
    });
  }

  try {
    await prisma.$disconnect();
  } catch (error) {
    // Ignore disconnect errors
  }

  const hasErrors = results.tests.some((t: any) => t.status === 'failed');
  return NextResponse.json(results, { status: hasErrors ? 500 : 200 });
}

