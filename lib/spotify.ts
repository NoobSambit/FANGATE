import axios from 'axios';

const BTS_ARTIST_IDS = [
  '3Nrfpe0tUJi4K4DXYWgMUX',
];

const BTS_SOLO_ARTIST_IDS = [
  '5vV3bFXnN6D6N3Nj4xRvaV',
  '57IVNoGtpJfyZbtoanDyco',
  '3JsHnjpbhX4SnySpvpa9DK',
  '6HvZYsbFfjnjFrWF950C9d',
  '0k17h0D3J5VfsdmQ1iZtE9',
  '1oSPZhvZMIrWW5I41kPkkY',
  '5KNNVgR6LBIABRIomyCEDJ',
];

export async function getSpotifyData(accessToken: string) {
  const headers = {
    Authorization: `Bearer ${accessToken}`,
  };

  try {
    const [topArtistsRes, topTracksRes, recentlyPlayedRes] = await Promise.all([
      axios.get('https://api.spotify.com/v1/me/top/artists?limit=50&time_range=medium_term', { headers }),
      axios.get('https://api.spotify.com/v1/me/top/tracks?limit=50&time_range=medium_term', { headers }),
      axios.get('https://api.spotify.com/v1/me/player/recently-played?limit=50', { headers }),
    ]);

    return {
      topArtists: topArtistsRes.data.items,
      topTracks: topTracksRes.data.items,
      recentlyPlayed: recentlyPlayedRes.data.items,
    };
  } catch (error) {
    console.error('Error fetching Spotify data:', error);
    throw error;
  }
}

export function calculateFanScore(spotifyData: any, accountCreatedAt: Date) {
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
  
  const topArtistIds = spotifyData.topArtists.map((artist: any) => artist.id);
  const btsArtist = spotifyData.topArtists.find((artist: any) => 
    BTS_ARTIST_IDS.includes(artist.id)
  );
  
  if (btsArtist) {
    score += 50;
    breakdown.topArtists = 50;
    details.btsArtist = {
      id: btsArtist.id,
      name: btsArtist.name,
      image: btsArtist.images?.[0]?.url || btsArtist.images?.[1]?.url || null,
      external_urls: btsArtist.external_urls,
    };
  }
  
  const soloArtists = spotifyData.topArtists.filter((artist: any) => 
    BTS_SOLO_ARTIST_IDS.includes(artist.id)
  );
  const soloMembersCount = soloArtists.length;
  const soloMembersPoints = soloMembersCount * 20;
  score += soloMembersPoints;
  breakdown.soloMembers = soloMembersPoints;
  breakdown.soloMembersCount = soloMembersCount;
  
  details.soloArtists = soloArtists.map((artist: any) => ({
    id: artist.id,
    name: artist.name,
    image: artist.images?.[0]?.url || artist.images?.[1]?.url || null,
    external_urls: artist.external_urls,
  }));
  
  const btsTracks = spotifyData.topTracks.filter((track: any) =>
    track.artists.some((artist: any) => 
      BTS_ARTIST_IDS.includes(artist.id) || BTS_SOLO_ARTIST_IDS.includes(artist.id)
    )
  );
  const topTracksPoints = btsTracks.length * 10;
  score += topTracksPoints;
  breakdown.topTracks = topTracksPoints;
  breakdown.topTracksCount = btsTracks.length;
  
  details.topTracks = btsTracks.slice(0, 10).map((track: any) => ({
    id: track.id,
    name: track.name,
    artists: track.artists.map((a: any) => a.name).join(', '),
    album: track.album.name,
    image: track.album.images?.[0]?.url || track.album.images?.[1]?.url || null,
    external_urls: track.external_urls,
    preview_url: track.preview_url,
  }));
  
  const recentBTSItems = spotifyData.recentlyPlayed.filter((item: any) =>
    item.track.artists.some((artist: any) =>
      BTS_ARTIST_IDS.includes(artist.id) || BTS_SOLO_ARTIST_IDS.includes(artist.id)
    )
  );
  
  // Recent listening: 1 point per song, up to 50 points max (for 50 recently played tracks)
  const recentBTSListeningCount = recentBTSItems.length;
  const recentListeningPoints = Math.min(recentBTSListeningCount, 50);
  score += recentListeningPoints;
  breakdown.recentListening = recentListeningPoints;
  breakdown.recentListeningCount = recentBTSListeningCount;
  
  details.recentTracks = recentBTSItems.slice(0, 50).map((item: any) => ({
    id: item.track.id,
    name: item.track.name,
    artists: item.track.artists.map((a: any) => a.name).join(', '),
    album: item.track.album.name,
    image: item.track.album.images?.[0]?.url || item.track.album.images?.[1]?.url || null,
    external_urls: item.track.external_urls,
    preview_url: item.track.preview_url,
    played_at: item.played_at,
  }));
  
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
