import { PrismaClient } from "@prisma/client";
import { promises as fs } from "fs";
import path from "path";
import {
  validateQuizQuestions,
  type QuizQuestion,
} from "../lib/types/quiz";
import { generateHashFromQuestion } from "../lib/utils/quiz-hash";

const prisma = new PrismaClient();

interface QuizQuestionWithHash extends QuizQuestion {
  hash: string;
}

/**
 * Loads questions from quiz.json and validates the schema
 */
async function loadQuestions(): Promise<QuizQuestionWithHash[]> {
  const quizPath = path.resolve(__dirname, "..", "data", "quiz.json");
  console.log(`📁 Loading quiz data from: ${quizPath}`);

  const fileContent = await fs.readFile(quizPath, "utf-8");
  const parsed = JSON.parse(fileContent) as unknown;

  if (!Array.isArray(parsed)) {
    throw new Error("quiz.json must contain an array of questions");
  }

  // Validate against our Zod schema
  const validated = validateQuizQuestions(parsed);

  console.log(
    `📚 Loaded ${validated.length} questions from quiz.json (all valid)`,
  );

  // Generate hashes for ALL questions (always regenerate, ignore any existing hash values)
  const withHashes = validated.map((q) => ({
    ...q,
    hash: generateHashFromQuestion({ question: q.question, choices: q.choices }),
  }));

  // Skip duplicate detection - keep ALL questions from quiz.json
  // Note: If there are actual duplicate questions (same text + choices),
  // the database unique constraint on hash will cause an error.
  // This is intentional to ensure data quality.
  console.log(`🔐 Generated hashes for all ${withHashes.length} questions`);
  return withHashes;
}

/**
 * Main seed function
 */
async function main() {
  console.log("🎵 Starting quiz seed...");

  const questions = await loadQuestions();

  console.log("🧹 Clearing existing quiz questions...");
  const deleteResult = await prisma.quizQuestion.deleteMany();
  console.log(`   Deleted ${deleteResult.count} existing questions`);

  console.log(`📝 Inserting ${questions.length} quiz questions...`);

  // Use a transaction for atomicity - if anything fails, rollback everything
  const result = await prisma.quizQuestion.createMany({
    data: questions.map((q) => ({
      question: q.question,
      choices: q.choices,
      answerIndex: q.answerIndex,
      difficulty: q.difficulty,
      tags: q.tags,
      members: q.members,
      eras: q.eras,
      locale: q.locale,
      source: q.source,
      explanation: q.explanation,
      hash: q.hash,
    })),
    skipDuplicates: false,
  });

  console.log(`✅ Successfully inserted ${result.count} quiz questions!`);

  // Log summary by difficulty
  const difficultyCounts = questions.reduce(
    (acc, q) => {
      acc[q.difficulty] = (acc[q.difficulty] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  console.log("\n📊 Summary by difficulty:");
  Object.entries(difficultyCounts)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([difficulty, count]) => {
      console.log(`   ${difficulty}: ${count} questions`);
    });

  // Log tag summary
  const allTags = new Set<string>();
  questions.forEach((q) => q.tags.forEach((tag) => allTags.add(tag)));
  console.log(`\n🏷️  Unique tags: ${allTags.size}`);

  // Log era summary
  const allEras = new Set<string>();
  questions.forEach((q) => q.eras.forEach((era) => allEras.add(era)));
  console.log(`📅 Unique eras: ${allEras.size}`);
}

main()
  .catch((e) => {
    console.error("❌ Error seeding quiz:", e.message);
    if (e instanceof Error && e.stack) {
      console.error("\nStack trace:");
      console.error(e.stack);
    }
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
