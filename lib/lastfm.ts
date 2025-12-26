import axios from 'axios';
import crypto from 'crypto';

const LASTFM_API_KEY = process.env.LASTFM_API_KEY!;
const LASTFM_API_SECRET = process.env.LASTFM_API_SECRET!;
const LASTFM_API_URL = 'https://ws.audioscrobbler.com/2.0/';

// BTS artist name variations for Last.fm matching
const BTS_ARTIST_NAMES = [
  'BTS',
  '방탄소년단',
  'Bangtan Boys',
  'Bangtan Sonyeondan',
];

// BTS solo members
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
    name: string;
    mbid?: string;
    url: string;
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
 * Make a request to Last.fm API
 */
async function lastfmRequest(params: Record<string, string>) {
  try {
    const response = await axios.get(LASTFM_API_URL, {
      params: {
        ...params,
        api_key: LASTFM_API_KEY,
        format: 'json',
      },
    });
    return response.data;
  } catch (error: any) {
    console.error('Last.fm API Error:', error.response?.data || error.message);
    throw new Error(`Last.fm API Error: ${error.response?.data?.message || error.message}`);
  }
}

/**
 * Check if a Last.fm username exists and is public
 */
export async function validateLastfmUsername(username: string): Promise<boolean> {
  try {
    await lastfmRequest({
      method: 'user.getInfo',
      user: username,
    });
    return true;
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

    return {
      topArtists: topArtistsRes.topartists?.artist || [],
      topTracks: topTracksRes.toptracks?.track || [],
      recentTracks: recentTracksRes.recenttracks?.track || [],
      userInfo: userInfoRes.user,
    };
  } catch (error) {
    console.error('Error fetching Last.fm data:', error);
    throw error;
  }
}

/**
 * Check if an artist name matches BTS or solo members
 */
function isBTSArtist(artistName: string): boolean {
  const normalizedName = artistName.toLowerCase().trim();
  return BTS_ARTIST_NAMES.some(btsName =>
    normalizedName.includes(btsName.toLowerCase())
  );
}

function isBTSSoloMember(artistName: string): boolean {
  const normalizedName = artistName.toLowerCase().trim();
  return BTS_SOLO_MEMBERS.some(memberName =>
    normalizedName.includes(memberName.toLowerCase()) ||
    memberName.toLowerCase().includes(normalizedName)
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

  // Check for BTS in top artists (50 points)
  const btsArtist = lastfmData.topArtists.find((artist: LastFmArtist) =>
    isBTSArtist(artist.name)
  );

  if (btsArtist) {
    score += 50;
    breakdown.topArtists = 50;
    details.btsArtist = {
      name: btsArtist.name,
      playcount: btsArtist.playcount,
      image: btsArtist.image?.find((img: any) => img.size === 'large')?.[`#text`] ||
             btsArtist.image?.[0]?.[`#text`] || null,
      url: btsArtist.url,
    };
  }

  // Check for BTS solo members in top artists (20 points each, max 140)
  const soloArtists = lastfmData.topArtists.filter((artist: LastFmArtist) =>
    isBTSSoloMember(artist.name)
  );
  const soloMembersCount = soloArtists.length;
  const soloMembersPoints = soloMembersCount * 20;
  score += soloMembersPoints;
  breakdown.soloMembers = soloMembersPoints;
  breakdown.soloMembersCount = soloMembersCount;

  details.soloArtists = soloArtists.map((artist: LastFmArtist) => ({
    name: artist.name,
    playcount: artist.playcount,
    image: artist.image?.find((img: any) => img.size === 'large')?.[`#text`] ||
           artist.image?.[0]?.[`#text`] || null,
    url: artist.url,
  }));

  // Check for BTS tracks in top tracks (10 points each, max 500)
  const btsTracks = lastfmData.topTracks.filter((track: LastFmTrack) =>
    isBTSArtist(track.artist.name) || isBTSSoloMember(track.artist.name)
  );
  const topTracksPoints = btsTracks.length * 10;
  score += topTracksPoints;
  breakdown.topTracks = topTracksPoints;
  breakdown.topTracksCount = btsTracks.length;

  details.topTracks = btsTracks.slice(0, 10).map((track: LastFmTrack) => ({
    name: track.name,
    artist: track.artist.name,
    playcount: track.playcount,
    image: track.image?.find((img: any) => img.size === 'large')?.[`#text`] ||
           track.image?.[0]?.[`#text`] || null,
    url: track.url,
  }));

  // Check recent listening (1 point per BTS track, max 50)
  const recentBTSTracks = lastfmData.recentTracks.filter((track: LastFmTrack) =>
    isBTSArtist(track.artist.name) || isBTSSoloMember(track.artist.name)
  );
  const recentBTSListeningCount = recentBTSTracks.length;
  const recentListeningPoints = Math.min(recentBTSListeningCount, 50);
  score += recentListeningPoints;
  breakdown.recentListening = recentListeningPoints;
  breakdown.recentListeningCount = recentBTSListeningCount;

  details.recentTracks = recentBTSTracks.slice(0, 50).map((track: LastFmTrack) => ({
    name: track.name,
    artist: track.artist.name,
    image: track.image?.find((img: any) => img.size === 'large')?.[`#text`] ||
           track.image?.[0]?.[`#text`] || null,
    url: track.url,
    played_at: track.date ? new Date(parseInt(track.date.uts) * 1000).toISOString() : null,
  }));

  // Account age check (10 points if older than 60 days)
  const accountCreatedAt = new Date(parseInt(lastfmData.userInfo.registered.unixtime) * 1000);
  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  if (accountCreatedAt < sixtyDaysAgo) {
    score += 10;
    breakdown.accountAge = 10;
  }

  const totalScore = Math.min(score, 200);

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
