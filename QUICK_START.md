# Quick Start: Last.fm Integration

## 🚀 Get Started in 10 Minutes

### Step 1: Get API Key (5 min)
1. Go to: https://www.last.fm/api/account/create
2. Fill form:
   - Name: `FANGATE`
   - Description: `BTS fan verification`
   - Callback: `http://localhost:5000`
3. Submit → Copy API Key + Secret

### Step 2: Configure (2 min)
```bash
# Add to .env
LASTFM_API_KEY=paste_your_api_key_here
LASTFM_API_SECRET=paste_your_secret_here
ENABLE_LASTFM_VERIFICATION=true
```

### Step 3: Migrate Database (2 min)
```bash
npx prisma migrate dev --name add_lastfm_support
npx prisma generate
```

### Step 4: Switch Frontend (1 min)
```bash
# Backup old page
mv app/page.tsx app/page-spotify.tsx

# Use Last.fm page
mv app/page-lastfm.tsx app/page.tsx
```

### Step 5: Test (2 min)
```bash
npm run dev
# Open http://localhost:5000
# Enter any Last.fm username (e.g., "RJ")
```

## ✅ Done!

Your app now uses Last.fm username-only authentication!

## Quick Reference

### New Files
- `lib/lastfm.ts` - API integration
- `app/api/auth/lastfm/route.ts` - Auth endpoint
- `app/api/verification/lastfm/route.ts` - Verification endpoint
- `app/page-lastfm.tsx` - Frontend

### API Endpoints
```bash
# Authenticate
POST /api/auth/lastfm
Body: { "username": "lastfm_username" }

# Verify
POST /api/verification/lastfm
Body: { "username": "lastfm_username" }
```

### Environment Variables
```bash
LASTFM_API_KEY=required
LASTFM_API_SECRET=required
ENABLE_LASTFM_VERIFICATION=true
```

## Need Help?
- Full guide: [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md)
- Summary: [MIGRATION_SUMMARY.md](MIGRATION_SUMMARY.md)
- Last.fm API: https://www.last.fm/api/intro

---

**That's it!** You're ready to go! 🎉
