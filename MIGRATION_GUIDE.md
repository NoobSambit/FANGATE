# Migration Guide: Spotify → Last.fm

This guide will help you migrate from Spotify OAuth to Last.fm username-based authentication.

## Why Last.fm?

✅ **No OAuth Required** - Users just enter their username
✅ **Simpler Integration** - Just an API key, no client secret needed
✅ **Free Public API** - Access to top artists, tracks, and recent plays
✅ **Better Privacy** - No password or OAuth tokens needed
✅ **Username-only Authentication** - Exactly what you wanted!

## What Changed

### Authentication
- **Before**: Spotify OAuth with NextAuth (complex, requires redirect)
- **After**: Simple username input form (just type and go!)

### Data Source
- **Before**: Spotify API with OAuth access tokens
- **After**: Last.fm public API with just an API key

### Database
- **Before**: `User.spotifyId` (required)
- **After**: `User.lastfmUsername` (optional, supports both)

## Migration Steps

### 1. Get Last.fm API Credentials

1. Go to https://www.last.fm/api/account/create
2. Fill in the application details:
   - **Application name**: FANGATE
   - **Application description**: BTS fan verification game
   - **Callback URL**: `http://localhost:5000` (or your domain)
3. Click "Submit"
4. You'll receive:
   - **API Key** (32 characters)
   - **Shared Secret** (32 characters)

### 2. Update Environment Variables

Add to your `.env` file:

```bash
# Last.fm API Credentials
LASTFM_API_KEY=your_api_key_here
LASTFM_API_SECRET=your_shared_secret_here

# Optional: Enable/disable Last.fm verification (default: true)
ENABLE_LASTFM_VERIFICATION=true

# Legacy Spotify credentials (can be removed after migration)
# SPOTIFY_CLIENT_ID=...
# SPOTIFY_CLIENT_SECRET=...
# NEXTAUTH_SECRET=...
# NEXTAUTH_URL=...
```

### 3. Run Database Migration

The database schema has been updated to support Last.fm. Run the migration:

```bash
npx prisma migrate dev --name add_lastfm_support
```

This will:
- Add `lastfmUsername` field to User model
- Make `spotifyId` optional (for backward compatibility)
- Preserve existing user data

### 4. Update Your Frontend

**Option A: Replace the home page** (recommended for clean migration):

```bash
# Backup current page
mv app/page.tsx app/page-spotify-backup.tsx

# Use Last.fm version
mv app/page-lastfm.tsx app/page.tsx
```

**Option B: Keep both** (let users choose):
- Edit `app/page.tsx` to include a toggle or tabs for Spotify/Last.fm
- Load the appropriate flow based on user choice

### 5. Update API Endpoints

The new Last.fm endpoints are ready to use:

- **Authentication**: `POST /api/auth/lastfm`
  - Body: `{ "username": "lastfm_username" }`
  - Returns: User object

- **Verification**: `POST /api/verification/lastfm`
  - Body: `{ "username": "lastfm_username" }`
  - Returns: Fan score and breakdown

### 6. Test the Migration

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Test Last.fm authentication:
   - Enter a Last.fm username (e.g., "RJ" or your own)
   - Verify that user is created/found
   - Check that verification works

3. Common test usernames:
   - Your own Last.fm username
   - Any public Last.fm profile

## Data Comparison

### Spotify vs Last.fm Data Mapping

| Spotify API | Last.fm API | Notes |
|-------------|-------------|-------|
| `user.getTopArtists` | `user.getTopArtists` | ✅ Same data |
| `user.getTopTracks` | `user.getTopTracks` | ✅ Same data |
| `user.getRecentlyPlayed` | `user.getRecentTracks` | ✅ Same data |
| `user.profile` | `user.getInfo` | ✅ Account age, image |

### Scoring System (Unchanged!)

The scoring algorithm remains exactly the same:

- **Top Artists (BTS)**: 50 points
- **Solo Members**: 20 points each (max 140)
- **Top Tracks**: 10 points each (max 500)
- **Recent Listening**: 1 point each (max 50)
- **Account Age**: 10 points (if > 60 days)
- **Max Score**: 200 points

## Artist Matching

### Spotify (Before)
```typescript
const BTS_ARTIST_IDS = ['3Nrfpe0tUJi4K4DXYWgMUX'];
const BTS_SOLO_ARTIST_IDS = ['5vV3bFXnN6D6N3Nj4xRvaV', ...];
```

### Last.fm (After)
```typescript
const BTS_ARTIST_NAMES = ['BTS', '방탄소년단', 'Bangtan Boys'];
const BTS_SOLO_MEMBERS = ['Jungkook', 'Suga', 'RM', 'V', 'j-hope', 'Jimin', 'Jin'];
```

**Matching Logic**: Case-insensitive string matching with variations

## Troubleshooting

### "Last.fm username not found"
- User doesn't exist on Last.fm
- Profile might be private (rare)
- Check spelling

### "Failed to fetch Last.fm data"
- Check API key is correct
- Check API key is active
- Verify Last.fm API is not rate-limited (5 requests/sec limit)

### Database errors
- Run `npx prisma generate` after schema changes
- Check database connection in `.env`
- Verify migration completed successfully

### "ENABLE_LASTFM_VERIFICATION is false"
- Mock data will be used
- Set to `true` to use real Last.fm data
- Useful for testing without Last.fm account

## API Rate Limits

### Spotify
- Complex OAuth flow
- Rate limits vary by endpoint
- Requires refresh tokens

### Last.fm
- **5 requests per second** per API key
- No OAuth required for read operations
- No token refresh needed
- Much simpler!

## Security Comparison

### Spotify (Before)
❌ OAuth tokens stored in database
❌ Client secret in environment
❌ Refresh token management required
❌ Complex session handling

### Last.fm (After)
✅ No tokens stored
✅ Only API key needed (can be public in client-side code)
✅ No authentication state management
✅ No session expiration

## Rollback Plan

If you need to rollback to Spotify:

1. Restore backup:
   ```bash
   mv app/page-spotify-backup.tsx app/page.tsx
   ```

2. Keep environment variables:
   ```bash
   # Both can coexist
   SPOTIFY_CLIENT_ID=...
   LASTFM_API_KEY=...
   ```

3. Database supports both:
   - `spotifyId` still exists
   - `lastfmUsername` is optional
   - Users can have both

## Next Steps After Migration

1. **Remove Spotify dependencies** (optional):
   ```bash
   npm uninstall next-auth @next-auth/prisma-adapter
   ```

2. **Update documentation** to mention Last.fm instead of Spotify

3. **Update UI text** to reference Last.fm where needed

4. **Monitor API usage** at https://www.last.fm/api/account

5. **Consider adding both options** to let users choose their preferred service

## Support

If you encounter issues:

1. Check Last.fm API status: https://www.last.fm/
2. Verify your API key: https://www.last.fm/api/account
3. Review Last.fm API docs: https://www.last.fm/api/intro
4. Check browser console for errors
5. Review server logs for API errors

## Summary

✅ **Simpler**: No OAuth, just username
✅ **Faster**: Fewer API calls, no token refresh
✅ **Cleaner**: Less code, easier to maintain
✅ **Better UX**: Users just type their username and go!

The migration preserves all functionality while simplifying the authentication flow significantly. Users can now verify their BTS fandom by simply entering their Last.fm username - no complex OAuth flow required!
