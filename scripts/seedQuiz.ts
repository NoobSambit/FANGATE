import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

const fallbackQuestions = [
  {
    question: "What is the name of BTS's fandom?",
    options: ["BLINK", "ARMY", "ONCE", "STAY"],
    correctIndex: 1
  },
  {
    question: "Which BTS member is also known as Agust D?",
    options: ["RM", "J-Hope", "Suga", "Jin"],
    correctIndex: 2
  },
  {
    question: "Which BTS album contains the song 'Blood Sweat & Tears'?",
    options: ["Love Yourself: Tear", "Wings", "Map of the Soul: 7", "The Most Beautiful Moment in Life"],
    correctIndex: 1
  },
  {
    question: "Who is the leader of BTS?",
    options: ["Suga", "J-Hope", "RM", "Jin"],
    correctIndex: 2
  },
  {
    question: "Which member's solo album is called 'FACE'?",
    options: ["Jungkook", "Jimin", "V", "Jin"],
    correctIndex: 1
  }
];

async function main() {
  console.log('🎵 Starting quiz seed...');

  const existingCount = await prisma.quizQuestion.count();
  
  if (existingCount > 0) {
    console.log(`✅ Database already has ${existingCount} quiz questions. Skipping seed.`);
    return;
  }

  let questions = fallbackQuestions;
  const quizPath = path.join(process.cwd(), 'data', 'quiz.json');

  if (fs.existsSync(quizPath)) {
    try {
      const fileContent = fs.readFileSync(quizPath, 'utf-8');
      const parsedQuestions = JSON.parse(fileContent);
      questions = parsedQuestions;
      console.log(`📚 Loaded ${questions.length} questions from quiz.json`);
    } catch (error) {
      console.warn('⚠️  Failed to load quiz.json, using fallback questions:', error);
    }
  } else {
    console.log('📝 Using fallback questions (quiz.json not found)');
  }

  for (const q of questions) {
    await prisma.quizQuestion.create({
      data: {
        question: q.question,
        options: q.options,
        correctIndex: q.correctIndex
      }
    });
  }

  console.log(`✅ Successfully seeded ${questions.length} quiz questions!`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding quiz:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
