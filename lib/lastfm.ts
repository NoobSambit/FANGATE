import axios from 'axios';
import crypto from 'crypto';

const LASTFM_API_KEY = process.env.LASTFM_API_KEY!;
const LASTFM_API_SECRET = process.env.LASTFM_API_SECRET!;
const LASTFM_API_URL = 'https://ws.audioscrobbler.com/2.0/';

// Simple in-memory rate limiter (in production, use Redis or similar)
const rateLimiter = {
  requests: [] as number[],
  maxRequests: 5, // Last.fm allows 5 requests per second
  windowMs: 1000, // 1 second window

  checkLimit(): boolean {
    const now = Date.now();
    // Remove old requests outside the window
    this.requests = this.requests.filter(time => now - time < this.windowMs);

    if (this.requests.length >= this.maxRequests) {
      return false; // Rate limit exceeded
    }

    this.requests.push(now);
    return true;
  },

  async waitForSlot(): Promise<void> {
    const maxWaitTime = 5000; // Max 5 seconds wait
    const startTime = Date.now();

    while (!this.checkLimit()) {
      if (Date.now() - startTime > maxWaitTime) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      // Wait 100ms before checking again
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
};

// BTS artist name variations for Last.fm matching
const BTS_ARTIST_NAMES = [
  'BTS',
  '방탄소년단',
  'Bangtan Boys',
  'Bangtan Sonyeondan',
];

// BTS solo members - EXACT MATCHING ONLY
const BTS_SOLO_MEMBERS = [
  'Jungkook',
  'Jung Kook',
  'Suga',
  'Agust D',
  'RM',
  'Rap Monster',
  'V',
  'Kim Taehyung',
  'j-hope',
  'J-Hope',
  'Jung Hoseok',
  'Jimin',
  'Park Jimin',
  'Jin',
  'Kim Seokjin',
];

// Helper function for exact matching (case-insensitive)
function exactMatch(artistName: string, targetName: string): boolean {
  const normalizedArtist = artistName.toLowerCase().trim();
  const normalizedTarget = targetName.toLowerCase().trim();
  return normalizedArtist === normalizedTarget;
}

// Helper function to get artist name from track (handles both formats)
function getTrackArtistName(track: LastFmTrack): string {
  if (!track.artist) return '';
  // Last.fm API inconsistency: recentTracks uses '#text', topTracks uses 'name'
  return track.artist['#text'] || track.artist.name || '';
}

// Helper function to get artist image with fallback
function getArtistImage(artist: LastFmArtist): string | null {
  // Try to find a large image first
  const largeImage = artist.image?.find((img: any) => img.size === 'large' || img.size === 'extralarge');
  if (largeImage && largeImage['#text']) {
    return largeImage['#text'];
  }
  // Fallback to medium or small
  const mediumImage = artist.image?.find((img: any) => img.size === 'medium');
  if (mediumImage && mediumImage['#text']) {
    return mediumImage['#text'];
  }
  // Last resort: first available image
  if (artist.image && artist.image[0] && artist.image[0]['#text']) {
    return artist.image[0]['#text'];
  }
  // No image available - Last.fm often doesn't have images for all artists
  return null;
}

interface LastFmArtist {
  name: string;
  playcount: string;
  url: string;
  image: Array<{ '#text': string; size: string }>;
  mbid?: string;
}

interface LastFmTrack {
  name: string;
  artist: {
    name?: string;
    '#text'?: string;
    mbid?: string;
    url?: string;
  };
  playcount: string;
  url: string;
  image: Array<{ '#text': string; size: string }>;
  date?: {
    uts: string;
    '#text': string;
  };
}

interface LastFmUserInfo {
  name: string;
  realname: string;
  image: Array<{ '#text': string; size: string }>;
  registered: {
    unixtime: string;
    '#text': number;
  };
  playcount: string;
  url: string;
}

/**
 * Generate API signature for Last.fm authentication
 */
function generateSignature(params: Record<string, string>): string {
  const sortedKeys = Object.keys(params).sort();
  const signatureString = sortedKeys
    .map(key => `${key}${params[key]}`)
    .join('') + LASTFM_API_SECRET;

  return crypto.createHash('md5').update(signatureString, 'utf8').digest('hex');
}

/**
 * Make a request to Last.fm API with rate limiting and retry logic
 */
async function lastfmRequest(params: Record<string, string>, retries = 3): Promise<any> {
  // Wait for rate limit slot
  await rateLimiter.waitForSlot();

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await axios.get(LASTFM_API_URL, {
        params: {
          ...params,
          api_key: LASTFM_API_KEY,
          format: 'json',
        },
        timeout: 10000, // 10 second timeout
      });

      // Check for Last.fm API errors
      if (response.data.error) {
        const errorCode = parseInt(response.data.error);
        const errorMessage = response.data.message || 'Unknown Last.fm API error';

        // Handle specific error codes
        switch (errorCode) {
          case 2: // Invalid service
          case 3: // Invalid method
          case 16: // There was a temporary error processing your request
            if (attempt < retries - 1) {
              // Retry for transient errors
              await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
              continue;
            }
            throw new Error(`${errorMessage} (Error code: ${errorCode})`);
          case 4: // Authentication failed
            throw new Error('Last.fm API authentication failed. Please check your API credentials.');
          case 6: // User not found
          case 17: // User not found (alternative code)
            throw new Error('Last.fm user not found or profile is private.');
          case 8: // Operation failed
          case 9: // Invalid session key
          case 10: // Invalid API key
          case 11: // Service offline
          case 13: // Invalid method signature
          case 14: // Unauthorized token
          case 15: // This token has not been authorized
          case 26: // Suspended API key
          case 27: // Rate limit exceeded
          case 29: // Rate limit exceeded (alternative code)
            throw new Error(`${errorMessage} (Error code: ${errorCode})`);
          default:
            throw new Error(`${errorMessage} (Error code: ${errorCode})`);
        }
      }

      return response.data;
    } catch (error: any) {
      if (error.response?.status === 429) {
        // Rate limited by HTTP status
        if (attempt < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000 * (attempt + 1)));
          continue;
        }
        throw new Error('Rate limit exceeded. Please try again later.');
      }

      if (error.response?.status >= 500) {
        // Server errors - retry
        if (attempt < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
          continue;
        }
      }

      if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
        // Timeout errors - retry
        if (attempt < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
          continue;
        }
        throw new Error('Request timed out. Please check your connection and try again.');
      }

      // Re-throw on last attempt or for non-retryable errors
      if (attempt === retries - 1) {
        console.error('Last.fm API Error:', error.response?.data || error.message);
        throw new Error(`Last.fm API Error: ${error.response?.data?.message || error.message}`);
      }
    }
  }

  throw new Error('Failed to complete request after multiple attempts.');
}

/**
 * Check if a Last.fm username exists and is public
 */
export async function validateLastfmUsername(username: string): Promise<boolean> {
  if (!username || username.trim().length === 0) {
    return false;
  }

  // Username validation: Last.fm usernames are 1-15 characters, alphanumeric + _-
  if (!/^[a-zA-Z0-9_-]{1,15}$/.test(username)) {
    return false;
  }

  try {
    const result = await lastfmRequest({
      method: 'user.getInfo',
      user: username,
    });
    return result && result.user;
  } catch (error) {
    return false;
  }
}

/**
 * Get user information from Last.fm
 */
export async function getLastfmUserInfo(username: string): Promise<LastFmUserInfo> {
  const data = await lastfmRequest({
    method: 'user.getInfo',
    user: username,
  });
  return data.user;
}

/**
 * Get all Last.fm data for a user
 */
export async function getLastfmData(username: string) {
  try {
    const [topArtistsRes, topTracksRes, recentTracksRes, userInfoRes] = await Promise.all([
      lastfmRequest({
        method: 'user.getTopArtists',
        user: username,
        period: '6month', // medium_term equivalent
        limit: '50',
      }),
      lastfmRequest({
        method: 'user.getTopTracks',
        user: username,
        period: '6month',
        limit: '50',
      }),
      lastfmRequest({
        method: 'user.getRecentTracks',
        user: username,
        limit: '50',
      }),
      lastfmRequest({
        method: 'user.getInfo',
        user: username,
      }),
    ]);

    // Handle Last.fm response - they might return single object or array
    const topArtists = topArtistsRes.topartists?.artist;
    const topTracks = topTracksRes.toptracks?.track;
    const recentTracks = recentTracksRes.recenttracks?.track;

    return {
      topArtists: Array.isArray(topArtists) ? topArtists : (topArtists ? [topArtists] : []),
      topTracks: Array.isArray(topTracks) ? topTracks : (topTracks ? [topTracks] : []),
      recentTracks: Array.isArray(recentTracks) ? recentTracks : (recentTracks ? [recentTracks] : []),
      userInfo: userInfoRes.user,
    };
  } catch (error) {
    console.error('Error fetching Last.fm data:', error);
    throw error;
  }
}

/**
 * Check if an artist name matches BTS or solo members (EXACT MATCHING)
 */
function isBTSArtist(artistName: string | undefined): boolean {
  if (!artistName || typeof artistName !== 'string') {
    return false;
  }
  const normalizedName = artistName.toLowerCase().trim();
  // For BTS, we do substring match since it's a single group name
  return BTS_ARTIST_NAMES.some(btsName =>
    normalizedName === btsName.toLowerCase() ||
    normalizedName.includes(btsName.toLowerCase())
  );
}

function isBTSSoloMember(artistName: string | undefined): boolean {
  if (!artistName || typeof artistName !== 'string') {
    return false;
  }
  const normalizedName = artistName.toLowerCase().trim();

  // EXACT MATCH ONLY for solo members to avoid false positives
  // e.g., "V" should NOT match "Vishal-Shekhar"
  return BTS_SOLO_MEMBERS.some(memberName =>
    exactMatch(normalizedName, memberName)
  );
}

/**
 * Calculate fan score based on Last.fm data
 */
export function calculateFanScore(lastfmData: any) {
  let score = 0;
  const breakdown = {
    topArtists: 0,
    soloMembers: 0,
    soloMembersCount: 0,
    topTracks: 0,
    topTracksCount: 0,
    recentListening: 0,
    recentListeningCount: 0,
    accountAge: 0,
  };

  // Detailed data for display
  const details = {
    btsArtist: null as any,
    soloArtists: [] as any[],
    topTracks: [] as any[],
    recentTracks: [] as any[],
  };

  // Validate input data
  if (!lastfmData || typeof lastfmData !== 'object') {
    console.error('Invalid Last.fm data received:', lastfmData);
    return {
      totalScore: 0,
      breakdown,
      details,
    };
  }

  // Ensure we have arrays to work with
  const topArtists = Array.isArray(lastfmData.topArtists) ? lastfmData.topArtists : [];
  const topTracks = Array.isArray(lastfmData.topTracks) ? lastfmData.topTracks : [];
  const recentTracks = Array.isArray(lastfmData.recentTracks) ? lastfmData.recentTracks : [];

  // Check for BTS in top artists (50 points)
  const btsArtist = topArtists.find((artist: LastFmArtist) =>
    artist && artist.name && isBTSArtist(artist.name)
  );

  if (btsArtist) {
    score += 50;
    breakdown.topArtists = 50;
    details.btsArtist = {
      name: btsArtist.name || 'Unknown',
      playcount: btsArtist.playcount || '0',
      image: getArtistImage(btsArtist),
      url: btsArtist.url || '',
    };
  }

  // Check for BTS solo members in top artists (20 points each, max 140)
  // IMPORTANT: Count unique members only, not name variants
  // Map of member names to their canonical name (to deduplicate)
  const MEMBER_CANONICAL_NAMES: { [key: string]: string } = {
    'jungkook': 'Jungkook',
    'jung kook': 'Jungkook',
    'suga': 'Suga',
    'agust d': 'Agust D',
    'rm': 'RM',
    'rap monster': 'RM',
    'v': 'V',
    'kim taehyung': 'V',
    'j-hope': 'J-Hope',
    'jung hoseok': 'J-Hope',
    'jimin': 'Jimin',
    'park jimin': 'Jimin',
    'jin': 'Jin',
    'kim seokjin': 'Jin',
  };

  const soloArtists = topArtists.filter((artist: LastFmArtist) =>
    artist && artist.name && isBTSSoloMember(artist.name)
  );

  // Deduplicate by canonical member name
  const uniqueSoloMembers = new Set<string>();
  const uniqueSoloArtists: LastFmArtist[] = [];

  for (const artist of soloArtists) {
    const normalizedName = artist.name.toLowerCase().trim();
    const canonicalName = MEMBER_CANONICAL_NAMES[normalizedName] || artist.name;

    if (!uniqueSoloMembers.has(canonicalName)) {
      uniqueSoloMembers.add(canonicalName);
      uniqueSoloArtists.push(artist);
    }
  }

  const soloMembersCount = uniqueSoloMembers.size;
  const soloMembersPoints = soloMembersCount * 20;
  score += soloMembersPoints;
  breakdown.soloMembers = soloMembersPoints;
  breakdown.soloMembersCount = soloMembersCount;

  details.soloArtists = uniqueSoloArtists.map((artist: LastFmArtist) => ({
    name: artist.name || 'Unknown',
    playcount: artist.playcount || '0',
    image: getArtistImage(artist),
    url: artist.url || '',
  }));

  // Check for BTS tracks in top tracks (10 points each, max 500)
  const btsTracks = topTracks.filter((track: LastFmTrack) =>
    track &&
    getTrackArtistName(track) &&
    (isBTSArtist(getTrackArtistName(track)) || isBTSSoloMember(getTrackArtistName(track)))
  );
  const topTracksPoints = btsTracks.length * 10;
  score += topTracksPoints;
  breakdown.topTracks = topTracksPoints;
  breakdown.topTracksCount = btsTracks.length;

  details.topTracks = btsTracks.slice(0, 10).map((track: LastFmTrack) => ({
    name: track.name || 'Unknown Track',
    artist: getTrackArtistName(track) || 'Unknown Artist',
    playcount: track.playcount || '0',
    image: track.image?.find((img: any) => img.size === 'large')?.[`#text`] ||
           track.image?.[0]?.[`#text`] || null,
    url: track.url || '',
  }));

  // Check recent listening (1 point per BTS track, max 50)
  const recentBTSTracks = recentTracks.filter((track: LastFmTrack) =>
    track &&
    getTrackArtistName(track) &&
    (isBTSArtist(getTrackArtistName(track)) || isBTSSoloMember(getTrackArtistName(track)))
  );
  const recentBTSListeningCount = recentBTSTracks.length;
  const recentListeningPoints = Math.min(recentBTSListeningCount, 50);
  score += recentListeningPoints;
  breakdown.recentListening = recentListeningPoints;
  breakdown.recentListeningCount = recentBTSListeningCount;

  details.recentTracks = recentBTSTracks.slice(0, 50).map((track: LastFmTrack) => ({
    name: track.name || 'Unknown Track',
    artist: getTrackArtistName(track) || 'Unknown Artist',
    image: track.image?.find((img: any) => img.size === 'large')?.[`#text`] ||
           track.image?.[0]?.[`#text`] || null,
    url: track.url || '',
    played_at: (track.date && track.date.uts) ? new Date(parseInt(track.date.uts) * 1000).toISOString() : null,
  }));

  // Account age check (10 points if older than 60 days)
  if (lastfmData.userInfo && lastfmData.userInfo.registered && lastfmData.userInfo.registered.unixtime) {
    const accountCreatedAt = new Date(parseInt(lastfmData.userInfo.registered.unixtime) * 1000);
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    if (accountCreatedAt < sixtyDaysAgo) {
      score += 10;
      breakdown.accountAge = 10;
    }
  }

  // Ensure score is a valid number
  const totalScore = Math.min(Math.max(score, 0) || 0, 200);

  return {
    totalScore,
    breakdown,
    details,
  };
}

/**
 * Build mock Last.fm data for testing
 */
export function buildMockLastfmData() {
  return {
    topArtists: [
      {
        name: 'BTS',
        playcount: '1523',
        url: 'https://www.last.fm/music/BTS',
        image: [
          { '#text': 'https://lastfm.freetls.fastly.net/i/u/34s/2a96cbd8b46e442fc41c2b86b821562f.png', size: 'small' },
          { '#text': 'https://lastfm.freetls.fastly.net/i/u/64s/2a96cbd8b46e442fc41c2b86b821562f.png', size: 'medium' },
          { '#text': 'https://lastfm.freetls.fastly.net/i/u/174s/2a96cbd8b46e442fc41c2b86b821562f.png', size: 'large' },
        ],
      },
      {
        name: 'Jungkook',
        playcount: '842',
        url: 'https://www.last.fm/music/Jungkook',
        image: [
          { '#text': 'https://lastfm.freetls.fastly.net/i/u/174s/2a96cbd8b46e442fc41c2b86b821562f.png', size: 'large' },
        ],
      },
    ],
    topTracks: [
      {
        name: 'Dynamite',
        artist: { name: 'BTS', url: 'https://www.last.fm/music/BTS' },
        playcount: '342',
        url: 'https://www.last.fm/music/BTS/_/Dynamite',
        image: [
          { '#text': 'https://lastfm.freetls.fastly.net/i/u/174s/2a96cbd8b46e442fc41c2b86b821562f.png', size: 'large' },
        ],
      },
    ],
    recentTracks: [
      {
        name: 'Butter',
        artist: { name: 'BTS', url: 'https://www.last.fm/music/BTS' },
        url: 'https://www.last.fm/music/BTS/_/Butter',
        image: [
          { '#text': 'https://lastfm.freetls.fastly.net/i/u/174s/2a96cbd8b46e442fc41c2b86b821562f.png', size: 'large' },
        ],
        date: {
          uts: String(Math.floor(Date.now() / 1000) - 3600),
          '#text': new Date(Date.now() - 3600000).toISOString(),
        },
      },
    ],
    userInfo: {
      name: 'mockuser',
      realname: 'Mock User',
      image: [
        { '#text': '', size: 'small' },
        { '#text': '', size: 'medium' },
        { '#text': '', size: 'large' },
      ],
      registered: {
        unixtime: String(Math.floor(Date.now() / 1000) - 365 * 24 * 60 * 60),
        '#text': Date.now() - 365 * 24 * 60 * 60 * 1000,
      },
      playcount: '15234',
      url: 'https://www.last.fm/user/mockuser',
    },
  };
}
