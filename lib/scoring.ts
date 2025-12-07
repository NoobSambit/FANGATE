/**
 * Scoring System Configuration
 * This file defines the complete scoring system for FanGate verification
 */

export const SCORING_SYSTEM = {
  // Top Artists Analysis
  topArtists: {
    name: 'Top Artists Analysis',
    description: 'BTS in your top 50 artists (medium-term)',
    points: 50,
    maxPoints: 50,
    requirement: 'BTS must be in your top 50 artists',
  },

  // Solo Member Recognition
  soloMembers: {
    name: 'Solo Member Recognition',
    description: 'BTS solo artists in your top 50 artists',
    pointsPerArtist: 20,
    maxPoints: 140, // Up to 7 solo artists
    requirement: 'Each BTS solo artist (Jungkook, V, Jimin, RM, Suga, J-Hope, Jin) in top 50',
  },

  // Top Tracks
  topTracks: {
    name: 'Top Tracks',
    description: 'BTS tracks in your top 50 tracks (medium-term)',
    pointsPerTrack: 10,
    maxPoints: 500, // Up to 50 tracks (theoretical max)
    requirement: 'Each BTS track in your top 50 tracks',
  },

  // Recent Listening
  recentListening: {
    name: 'Recent Listening',
    description: 'BTS tracks in your recently played (last 50 tracks)',
    pointsPerTrack: 1,
    maxPoints: 50, // Up to 50 recently played tracks
    requirement: 'Each BTS track in your recently played list',
  },

  // Account Age
  accountAge: {
    name: 'Account Age',
    description: 'Spotify account age bonus',
    points: 10,
    maxPoints: 10,
    requirement: 'Account must be older than 60 days',
  },
} as const;

export const SCORING_SUMMARY = {
  minimumScore: 70,
  quizQuestions: 10,
  quizPassRate: 70, // 70% = 7/10 questions correct
  maxScore: 200, // Maximum possible score (capped)
  totalPossiblePoints: 750, // Theoretical maximum (50 + 140 + 500 + 50 + 10)
  // Combined scoring weights
  spotifyWeight: 0.4, // 40% weight for Spotify score
  quizWeight: 0.6, // 60% weight for quiz score (quiz is weighted more)
  combinedMinimum: 70, // Minimum combined score to pass
} as const;

/**
 * Get detailed scoring breakdown for display
 */
export function getScoringBreakdown() {
  return {
    categories: [
      {
        category: 'topArtists',
        ...SCORING_SYSTEM.topArtists,
        example: 'If BTS is in your top artists: +50 points',
      },
      {
        category: 'soloMembers',
        ...SCORING_SYSTEM.soloMembers,
        example: 'Jungkook in top artists: +20 points, V in top artists: +20 points, etc.',
      },
      {
        category: 'topTracks',
        ...SCORING_SYSTEM.topTracks,
        example: '10 BTS tracks in top 50: +100 points (10 tracks × 10 points)',
      },
      {
        category: 'recentListening',
        ...SCORING_SYSTEM.recentListening,
        example: '20 BTS tracks in recently played: +20 points (20 tracks × 1 point)',
      },
      {
        category: 'accountAge',
        ...SCORING_SYSTEM.accountAge,
        example: 'Account older than 60 days: +10 points',
      },
    ],
    summary: SCORING_SUMMARY,
  };
}

