# Spotify OAuth Setup Checklist

## Common 400 Error Causes

The 400 error from Spotify means the OAuth request is invalid. Check these:

### 1. ✅ Environment Variables (REQUIRED)

**Local Development (.env.local):**
```env
SPOTIFY_CLIENT_ID=your_client_id_here
SPOTIFY_CLIENT_SECRET=your_client_secret_here
NEXTAUTH_SECRET=your_generated_secret
NEXTAUTH_URL=http://localhost:5000
```

**Production (Netlify):**
```env
SPOTIFY_CLIENT_ID=your_client_id_here
SPOTIFY_CLIENT_SECRET=your_client_secret_here
NEXTAUTH_SECRET=your_generated_secret
NEXTAUTH_URL=https://fangate.netlify.app
```

### 2. ✅ Spotify Developer Dashboard Configuration

1. Go to: https://developer.spotify.com/dashboard
2. Select your app (or create one)
3. Click **"Edit Settings"**
4. Under **"Redirect URIs"**, add EXACTLY these URLs:

   **For Local Development:**
   ```
   http://localhost:5000/api/auth/callback/spotify
   ```

   **For Production:**
   ```
   https://fangate.netlify.app/api/auth/callback/spotify
   ```

   ⚠️ **IMPORTANT:** 
   - Must match EXACTLY (including http vs https, port number, trailing slashes)
   - No trailing slash after `spotify`
   - Case-sensitive

5. Click **"Add"** and **"Save"**

### 3. ✅ Verify Client ID & Secret

- Copy **Client ID** from Spotify dashboard → Settings
- Copy **Client Secret** (click "View client secret" to reveal)
- Make sure they match your `.env` file exactly
- No extra spaces or quotes

### 4. ✅ NextAuth URL Format

- Local: `http://localhost:5000` (no trailing slash)
- Production: `https://fangate.netlify.app` (no trailing slash)
- Must match the base URL where your app is running

### 5. ✅ Test the Callback URL

The callback URL NextAuth generates is:
```
{NEXTAUTH_URL}/api/auth/callback/spotify
```

So for production it should be:
```
https://fangate.netlify.app/api/auth/callback/spotify
```

This MUST be in your Spotify dashboard redirect URIs list.

## Debugging Steps

1. **Check browser console** - Look for the exact error message
2. **Check Netlify logs** - See if there are server-side errors
3. **Verify env vars are loaded** - Add a test endpoint to log them (don't expose secrets!)
4. **Test locally first** - Make sure it works on localhost before deploying

## Common Mistakes

❌ Wrong redirect URI format
❌ Missing NEXTAUTH_URL
❌ Client ID/Secret have extra spaces
❌ Using http instead of https in production
❌ Redirect URI not saved in Spotify dashboard
❌ Using wrong port number (5000 vs 3000)

