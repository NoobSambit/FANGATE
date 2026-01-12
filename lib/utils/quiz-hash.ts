import { createHash } from "crypto";

/**
 * Generates a deterministic SHA-256 hash for a quiz question.
 *
 * The hash is based on the normalized question text and choices,
 * making it useful for:
 * - Detecting duplicate questions
 * - Data integrity verification
 * - Change detection between versions
 *
 * @param question - The question text
 * @param choices - Array of answer choices
 * @returns A hexadecimal SHA-256 hash string
 *
 * @example
 * ```ts
 * const hash = generateQuestionHash(
 *   "Which BTS member is the leader?",
 *   ["RM", "Jin", "Suga", "J-Hope"]
 * );
 * // Returns: "a1b2c3d4e5f6..."
 * ```
 */
export function generateQuestionHash(
  question: string,
  choices: string[],
): string {
  // Normalize the input for consistent hashing
  const normalized = JSON.stringify({
    q: question.trim().toLowerCase(),
    // Sort choices to ensure same questions with different order produce same hash
    c: choices
      .map((c) => c.trim().toLowerCase())
      .sort(),
  });

  return createHash("sha256").update(normalized).digest("hex");
}

/**
 * Generates a hash from a complete question object.
 * Extracts question and choices before hashing.
 *
 * @param questionObj - Object containing question and choices properties
 * @returns A hexadecimal SHA-256 hash string
 */
export function generateHashFromQuestion(
  questionObj: { question: string; choices: string[] },
): string {
  return generateQuestionHash(questionObj.question, questionObj.choices);
}

/**
 * Verifies if a given hash matches the computed hash for a question.
 *
 * @param question - The question text
 * @param choices - Array of answer choices
 * @param hashToVerify - The hash to verify against
 * @returns true if the hash matches, false otherwise
 */
export function verifyQuestionHash(
  question: string,
  choices: string[],
  hashToVerify: string,
): boolean {
  const computedHash = generateQuestionHash(question, choices);
  return computedHash === hashToVerify;
}
