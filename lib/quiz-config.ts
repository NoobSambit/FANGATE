/**
 * Quiz Battle Configuration
 *
 * Centralized configuration for quiz battle settings.
 * IMPORTANT: These values must be consistent across client and server.
 */

export const QUIZ_BATTLE_CONFIG = {
  /**
   * Time limit for the quiz battle in seconds.
   * - Client timer counts down from this value
   * - Server enforces this as the maximum time limit
   * - Displayed to users as MM:SS format
   */
  TIME_LIMIT_SECONDS: 200, // ~3 minutes 20 seconds

  /**
   * Grace period after battle completes (in seconds)
   * Allows clients to submit final answers even after server marks battle as complete
   */
  SUBMISSION_GRACE_PERIOD_SECONDS: 30,
} as const;

// Helper to format time as MM:SS
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Helper to get time remaining from start time
export function getTimeRemaining(actualStartTime: Date | string | null): number {
  if (!actualStartTime) return QUIZ_BATTLE_CONFIG.TIME_LIMIT_SECONDS;

  const start = new Date(actualStartTime).getTime();
  const now = Date.now();
  const elapsed = Math.floor((now - start) / 1000);
  return Math.max(0, QUIZ_BATTLE_CONFIG.TIME_LIMIT_SECONDS - elapsed);
}
