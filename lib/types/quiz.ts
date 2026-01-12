import { z } from "zod";

/**
 * BTS Member enum for validation
 */
export const BTS_MEMBER = [
  "RM",
  "Jin",
  "Suga",
  "J-Hope",
  "Jimin",
  "V",
  "Jungkook",
] as const;
export type BTSMember = (typeof BTS_MEMBER)[number];

/**
 * Difficulty levels
 */
export const DIFFICULTY = ["easy", "medium", "hard"] as const;
export type Difficulty = (typeof DIFFICULTY)[number];

/**
 * Full quiz question schema with all metadata fields
 * This is the source of truth for quiz data structure
 */
export const QuizQuestionSchema = z.object({
  question: z.string().min(1, "Question text is required"),
  choices: z
    .array(z.string().min(1))
    .length(4, "Exactly 4 choices are required"),
  answerIndex: z
    .number()
    .int("answerIndex must be an integer")
    .min(0, "answerIndex must be at least 0")
    .max(3, "answerIndex must be at most 3"),
  difficulty: z.enum(DIFFICULTY, {
    errorMap: () => ({ message: "Difficulty must be: easy, medium, or hard" }),
  }),
  tags: z.array(z.string()).min(1, "At least one tag is required"),
  members: z
    .array(z.enum(BTS_MEMBER))
    .min(1, "At least one BTS member must be specified"),
  eras: z.array(z.string()).min(1, "At least one era must be specified"),
  locale: z
    .string()
    .length(2, "Locale must be a 2-letter code (e.g., 'en')")
    .default("en"),
  source: z.string().min(1, "Source is required"),
  explanation: z.string().min(1, "Explanation is required"),
  hash: z.string().optional(),
});

export type QuizQuestion = z.infer<typeof QuizQuestionSchema>;

/**
 * Quiz question as stored in database (with generated fields)
 */
export const QuizQuestionDBSchema = QuizQuestionSchema.extend({
  id: z.string().uuid(),
  hash: z.string(),
  createdAt: z.date(),
  updatedAt: z.date().optional(),
});

export type QuizQuestionDB = z.infer<typeof QuizQuestionDBSchema>;

/**
 * Quiz question as sent to client (without correct answer)
 */
export const QuizQuestionClientSchema = QuizQuestionSchema.omit({
  answerIndex: true,
}).extend({
  id: z.string().uuid(),
});

export type QuizQuestionClient = z.infer<typeof QuizQuestionClientSchema>;

/**
 * Question result (shown after quiz completion, includes correct answer)
 */
export const QuestionResultSchema = QuizQuestionSchema.extend({
  id: z.string().uuid(),
  userAnswer: z.number().int().min(0).max(3),
  isCorrect: z.boolean(),
});

export type QuestionResult = z.infer<typeof QuestionResultSchema>;

/**
 * Validation function for quiz JSON file
 * Throws detailed error if validation fails
 */
export function validateQuizQuestions(data: unknown): QuizQuestion[] {
  const result = z.array(QuizQuestionSchema).safeParse(data);

  if (!result.success) {
    const errors = result.error.errors
      .map((e) => {
        const path = e.path.join(".");
        return `  - ${path ? path + ": " : ""}${e.message}`;
      })
      .join("\n");
    throw new Error(`Quiz validation failed:\n${errors}`);
  }

  return result.data;
}

/**
 * Check for duplicate hashes in an array of questions
 */
export function findDuplicateHashes(questions: QuizQuestion[]): string[] {
  const hashCount = new Map<string, number>();
  const duplicates: string[] = [];

  questions.forEach((q) => {
    if (q.hash) {
      const count = hashCount.get(q.hash) || 0;
      hashCount.set(q.hash, count + 1);
      if (count === 1) {
        duplicates.push(q.hash);
      }
    }
  });

  return duplicates;
}

/**
 * Validate a single question (useful for form validation)
 */
export function validateSingleQuestion(data: unknown): QuizQuestion {
  const result = QuizQuestionSchema.safeParse(data);

  if (!result.success) {
    const errors = result.error.errors
      .map((e) => `${e.path.join(".")}: ${e.message}`)
      .join(", ");
    throw new Error(`Invalid question: ${errors}`);
  }

  return result.data;
}
