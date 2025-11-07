import { PrismaClient } from '@prisma/client';
import { promises as fs } from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function loadQuestions() {
  const quizPath = path.resolve(__dirname, '..', 'data', 'quiz.json');
  console.log(`📁 Loading quiz data from: ${quizPath}`);

  const fileContent = await fs.readFile(quizPath, 'utf-8');
  const parsed = JSON.parse(fileContent);

  if (!Array.isArray(parsed)) {
    throw new Error('quiz.json must contain an array of questions');
  }

  parsed.forEach((q, idx) => {
    if (typeof q.question !== 'string' || !Array.isArray(q.options) || typeof q.correctIndex !== 'number') {
      throw new Error(`Invalid question shape at index ${idx}`);
    }
  });

  console.log(`📚 Loaded ${parsed.length} questions from quiz.json`);
  return parsed;
}

async function main() {
  console.log('🎵 Starting quiz seed...');

  const questions = await loadQuestions();

  console.log('🧹 Clearing existing quiz questions...');
  await prisma.quizQuestion.deleteMany();

  console.log(`📝 Inserting ${questions.length} quiz questions...`);
  await prisma.quizQuestion.createMany({
    data: questions.map((q) => ({
      question: q.question,
      options: q.options,
      correctIndex: q.correctIndex,
    })),
    skipDuplicates: false,
  });

  console.log('✅ Quiz questions seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding quiz:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
