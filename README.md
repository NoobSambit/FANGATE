## FanGate — BTS Fan Verification

Verify yourself as ARMY using your Spotify listening plus a short quiz to gain access to the BTS concert ticketing page. Beautiful BTS‑themed UI, social share previews, and a downloadable “Verified ARMY” pass card.

### Features
- Spotify-based fan scoring + 10‑question quiz (combined score: Spotify 40% + Quiz 60%)
- Success page with clear pass message and combined score
- BTS‑themed “Verified ARMY” card you can download as JPG and share
- One‑click “Post on Twitter” link (no API needed) with prefilled tweet
- Proper Open Graph/Twitter metadata for rich link previews
- App favicon and navigation use the FanGate logo

### Tech
- Next.js 14 (App Router), TypeScript, Tailwind CSS
- next-auth (Spotify OAuth), Prisma
- html2canvas for generating the shareable JPG

### Getting Started
1. Clone and install:
```bash
npm install
```

2. Create `.env`:
```bash
# Next/Auth
NEXTAUTH_URL=http://localhost:5000
NEXTAUTH_SECRET=your-nextauth-secret

# Spotify OAuth
SPOTIFY_CLIENT_ID=your-client-id
SPOTIFY_CLIENT_SECRET=your-client-secret

# App URLs (used for OG cards and tweet links)
NEXT_PUBLIC_SITE_URL=http://localhost:5000

# Optional: external redirect for ticket sale target
NEXT_PUBLIC_TICKET_REDIRECT_URL=https://tickets.example.com
```

3. Database and seed (if applicable):
```bash
npm run postinstall
npm run seed
```

4. Run:
```bash
npm run dev
```
Visit http://localhost:5000

### Social Sharing
- When you share your site URL, social cards use this image:
  - `https://res.cloudinary.com/dtamgk7i5/image/upload/v1762777066/fangate_hrnkge.png`
- Description: “Verify yourself as ARMY to get access to BTS concert ticketing page.”
- You can customize these in `app/layout.tsx` via `metadata`, `openGraph`, and `twitter`.

### Verified ARMY Card (Download & Tweet)
- On the success page, a BTS‑themed card appears via an overlay. You can:
  - Click “Download ARMY Pass” to save a JPG (client‑side with `html2canvas`)
  - Click “Post on Twitter” to open a prefilled tweet link
    - This uses `https://twitter.com/intent/tweet?text=...`
    - No Twitter API keys are needed
    - To include the card image, users simply attach the downloaded JPG in the Twitter UI

### Branding
- App icon and navbar/footer logo come from `public/fangate-logo.png`
- Update or replace that file to change branding

### Environment Variables Reference
- `NEXT_PUBLIC_SITE_URL`: Public base URL used in OG tags and tweet text
- `NEXT_PUBLIC_TICKET_REDIRECT_URL`: Where a valid token can be consumed (optional)

### Scripts
- `npm run dev` — Start dev server on port 5000
- `npm run build` — Build production
- `npm run start` — Run production
- `npm run seed` — Seed quiz questions

### Notes
- We don’t auto‑post to Twitter without using their API. The “Post on Twitter” button opens a prefilled compose link; users manually attach the JPG.
- If you update domains, also update `NEXT_PUBLIC_SITE_URL` so social previews and tweet text stay correct.

---
Made with 💜 for ARMY.


