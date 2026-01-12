import { PrismaClient } from "@prisma/client";
import { promises as fs } from "fs";
import path from "path";
import { validateQuizQuestions, type QuizQuestion } from "../lib/types/quiz";
import { generateHashFromQuestion } from "../lib/utils/quiz-hash";

const prisma = new PrismaClient();

interface QuizQuestionWithHash extends QuizQuestion {
  hash: string;
  originalIndex?: number;
}

async function findDuplicates() {
  const quizPath = path.resolve(__dirname, "..", "data", "quiz.json");
  const fileContent = await fs.readFile(quizPath, "utf-8");
  const parsed = JSON.parse(fileContent) as unknown;
  const validated = validateQuizQuestions(parsed);

  // Generate hashes for all questions
  const withHashes = validated.map((q, index) => ({
    ...q,
    hash: generateHashFromQuestion({ question: q.question, choices: q.choices }),
    originalIndex: index,
  }));

  // Find duplicates
  const hashMap = new Map<string, QuizQuestionWithHash[]>();
  for (const question of withHashes) {
    if (!hashMap.has(question.hash)) {
      hashMap.set(question.hash, []);
    }
    hashMap.get(question.hash)!.push(question);
  }

  // Show only duplicates
  let duplicateCount = 0;
  for (const [hash, questions] of Array.from(hashMap.entries())) {
    if (questions.length > 1) {
      duplicateCount++;
      console.log("=".repeat(80));
      console.log(`DUPLICATE SET #${duplicateCount} (hash: ${hash.substring(0, 16)}...)`);
      console.log(`Found ${questions.length} identical questions:\n`);

      questions.forEach((q, i) => {
        console.log(`  [Question #${q.originalIndex! + 1}]`);
        console.log(`  Question: ${q.question}`);
        console.log(`  Choices: ${JSON.stringify(q.choices)}`);
        console.log(`  Correct: ${q.choices[q.answerIndex]}`);
        console.log(`  Difficulty: ${q.difficulty}`);
        console.log(`  Tags: ${q.tags.join(", ")}`);
        console.log(`  Source: ${q.source}`);
        console.log("");
      });
    }
  }

  console.log("=".repeat(80));
  console.log(`SUMMARY: Found ${duplicateCount} sets of duplicate questions`);
  console.log(`Total questions in file: ${validated.length}`);
  console.log(`Unique questions: ${hashMap.size}`);
  console.log(`Duplicates removed: ${validated.length - hashMap.size}`);
}

findDuplicates()
  .catch((e) => {
    console.error("Error:", e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
