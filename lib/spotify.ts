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
  
  const topArtistIds = spotifyData.topArtists.map((artist: any) => artist.id);
  const hasBTS = topArtistIds.some((id: string) => BTS_ARTIST_IDS.includes(id));
  
  if (hasBTS) {
    score += 50;
  }
  
  const soloMembersCount = topArtistIds.filter((id: string) => 
    BTS_SOLO_ARTIST_IDS.includes(id)
  ).length;
  score += soloMembersCount * 20;
  
  const btsTracks = spotifyData.topTracks.filter((track: any) =>
    track.artists.some((artist: any) => 
      BTS_ARTIST_IDS.includes(artist.id) || BTS_SOLO_ARTIST_IDS.includes(artist.id)
    )
  );
  score += btsTracks.length * 10;
  
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const recentBTSListening = spotifyData.recentlyPlayed.some((item: any) =>
    item.track.artists.some((artist: any) =>
      BTS_ARTIST_IDS.includes(artist.id) || BTS_SOLO_ARTIST_IDS.includes(artist.id)
    )
  );
  
  if (recentBTSListening) {
    score += 30;
  }
  
  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
  
  if (accountCreatedAt < sixtyDaysAgo) {
    score += 10;
  }
  
  return Math.min(score, 200);
}
