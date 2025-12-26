# FANGATE — BTS Fan Verification & Quiz Battle Platform

**FANGATE** is an interactive web application designed for BTS fans (ARMY) to verify their dedication through music listening analysis and trivia challenges. Features include single-player verification with access tokens, multiplayer real-time quiz battles, downloadable score cards, and social sharing.

---

## Table of Contents

- [Features Overview](#features-overview)
- [Core Features](#core-features)
  - [Fan Verification System](#1-fan-verification-system)
  - [Quiz Battle (Multiplayer)](#2-quiz-battle-multiplayer)
  - [Social Sharing & Downloads](#3-social-sharing--downloads)
- [How It Works](#how-it-works)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [API Endpoints](#api-endpoints)
- [Project Structure](#project-structure)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

---

## Features Overview

### Main Features
- **Last.fm Integration** — Username-based authentication (no OAuth required)
- **Fan Score Calculation** — Analyzes listening history for BTS content
- **Single-Player Quiz** — 10 BTS trivia questions with 5-minute timer
- **Multiplayer Quiz Battle** — Real-time battles with up to 5 players
- **Combined Scoring** — Last.fm (40%) + Quiz (60%) = Verification score
- **Access Tokens** — Time-limited (10 min) tokens for verified users
- **Downloadable Score Cards** — Shareable JPG images of results
- **Twitter Integration** — One-click sharing with prefilled tweets
- **BTS-Themed UI** — Dark theme with gradient overlays and animations
- **Donation Support** — Ko-fi integration for platform sustainability

---

## Core Features

### 1. Fan Verification System

#### **Last.fm Authentication** ([app/page.tsx:1](app/page.tsx#L1))
- Simple username input (no password required)
- Reads public Last.fm data via API
- Creates/updates user in database
- No complex OAuth flow

#### **Fan Score Calculation** ([lib/lastfm.ts:1](lib/lastfm.ts#L1), [lib/scoring.ts:1](lib/scoring.ts#L1))

The system analyzes your Last.fm listening history:

| Category | Points | Max | Details |
|----------|--------|-----|---------|
| **BTS in Top Artists** | 50 | 50 | BTS (방탄소년단) in top 50 artists |
| **Solo Members** | 20 each | 140 | Jungkook, Suga, RM, V, J-Hope, Jimin, Jin |
| **BTS Top Tracks** | 10 each | 500 | BTS tracks in your top 50 |
| **Recent Listening** | 1 each | 50 | BTS tracks in last 50 plays |
| **Account Age Bonus** | 10 | 10 | Account older than 60 days |
| **TOTAL** | — | **200** | Maximum possible score |

**Combined Verification:**
- Last.fm Score: 40% weight
- Quiz Score: 60% weight
- **Pass Requirement:** 70/100 combined score

#### **Single-Player Quiz** ([app/quiz/page.tsx:1](app/quiz/page.tsx#L1))
- 10 BTS trivia questions
- Multiple choice (4 options per question)
- 5-minute countdown timer
- Navigate between questions (forward/backward)
- Real-time progress tracking
- Minimum 7/10 correct to contribute to passing

#### **Verification Results** ([app/verification/page.tsx:1](app/verification/page.tsx#L1))
- Detailed score breakdown
- Last.fm listening analysis
- Quiz performance review
- Generated access token (if passed)
- Downloadable "ARMY Pass" card
- Twitter sharing option
- Confetti animation for passing users

---

### 2. Quiz Battle (Multiplayer)

#### **Battle Creation & Management** ([app/quiz-battle/page.tsx:1](app/quiz-battle/page.tsx#L1))

**Host Battle:**
- Generates unique 6-character access code (30^6 possible combinations)
- Selects 15 random BTS trivia questions
- Supports up to 5 players (configurable)
- No login required — uses client-generated UUIDs

**Join Battle:**
- Enter access code to join existing battle
- Provide nickname for display
- Battle must be in "waiting" status
- Automatic participant list updates

#### **Battle Lobby** ([app/quiz-battle/lobby/page.tsx:1](app/quiz-battle/lobby/page.tsx#L1))
- Displays access code for sharing
- Shows participant list with ready status
- "Ready" indicator for synchronization
- Host controls battle start
- Requires minimum 2 participants

#### **Real-Time Gameplay** ([app/quiz-battle/play/page.tsx:1](app/quiz-battle/play/page.tsx#L1))

**Key Features:**
- **Synchronized Start** — Timer begins when all players mark "ready"
- **15 Questions** — Same questions in same order for all players
- **60-Second Timer** — Countdown starts after all players ready
- **Live Leaderboard** — See participants' progress and finish status
- **Batch Answer Submission** — Efficient bulk answer processing
- **Waiting Screen** — Shows while other players finish

**Technical Details:**
- Client-side polling (2-3 second intervals with jitter)
- Consistent question order using database-stored questionIds
- Grace period: 30 seconds after battle completion for late submissions
- Auto-completion when time expires or all players finish

#### **Battle Results** ([app/quiz-battle/results/page.tsx:1](app/quiz-battle/results/page.tsx#L1))
- **Leaderboard** with rankings (Gold, Silver, Bronze medals for top 3)
- Individual player statistics (score, accuracy, rank)
- Question-by-question breakdown
- Shows user answer vs correct answer
- Downloadable scorecard as JPG
- Twitter sharing with rank and score
- "Play Again" button to create new battle

---

### 3. Social Sharing & Downloads

#### **Score Card Downloads** (All result pages)
- HTML2Canvas integration for image generation
- High-quality JPG export (95% quality)
- Includes branding, score, and statistics
- Works for both verification and battle results
- Client-side generation (no server processing)

#### **Twitter Integration**
- One-click sharing via `twitter.com/intent/tweet`
- Prefilled contextual messages:
  - Verification pass/fail with score
  - Battle results with rank and stats
- Creator attribution (@Boy_With_Code)
- No Twitter API keys required
- Users manually attach downloaded images

#### **Open Graph & Social Metadata** ([app/layout.tsx:1](app/layout.tsx#L1))
- Rich link previews on social platforms
- Custom OG image: `https://res.cloudinary.com/dtamgk7i5/image/upload/v1762777066/fangate_hrnkge.png`
- Title: "FANGATE - Verify Your BTS Fandom"
- Description: "Verify yourself as ARMY to get access to BTS concert ticketing page."

---

## How It Works

### Verification Flow

```mermaid
graph TD
    A[Enter Last.fm Username] --> B[Fetch Listening Data]
    B --> C[Calculate Fan Score]
    C --> D{Score >= 70?}
    D -->|No| E[Show Score & Try Again]
    D -->|Yes| F[Proceed to Quiz]
    F --> G[Answer 10 Questions]
    G --> H[Calculate Combined Score]
    H --> I{Combined >= 70?}
    I -->|Yes| J[Generate Access Token]
    I -->|No| E
    J --> K[Download Pass & Share]
```

### Quiz Battle Flow

```mermaid
graph TD
    A[Create/Join Battle] --> B[Battle Lobby]
    B --> C[Host Starts Battle]
    C --> D[Players Load Questions]
    D --> E[All Players Mark Ready]
    E --> F[Timer Starts 60s]
    F --> G[Answer Questions]
    G --> H{Time Up OR All Finished?}
    H -->|No| G
    H -->|Yes| I[Submit Answers]
    I --> J[View Results & Leaderboard]
```

---

## Technology Stack

### Frontend
- **Framework:** Next.js 14.2.18 (App Router)
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS 3.4.1
- **UI Library:** React 18.3.1
- **Icons:** Lucide React 0.460.0
- **Animations:** React Confetti 6.1.0
- **Image Export:** html2canvas 1.4.1

### Backend
- **API:** Next.js API Routes
- **Authentication:** NextAuth.js 4.24.10 (optional Spotify)
- **Database ORM:** Prisma 5.22.0
- **Database:** PostgreSQL (recommended)
- **API Integration:** Axios 1.7.8
- **JWT:** jose 5.9.6

### External APIs
- **Last.fm API** — Music listening data
- **Spotify API** — Alternative music provider (optional)
- **Twitter Intent API** — Social sharing

### DevOps
- **Hosting:** Cloudflare Pages (@cloudflare/next-on-pages 1.12.0)
- **Package Manager:** npm
- **Runtime:** Node.js 20+

---

## Getting Started

### Prerequisites
- Node.js 20 or higher
- PostgreSQL database
- Last.fm API key ([Get one here](https://www.last.fm/api/account/create))
- Git

### Installation

1. **Clone the repository:**
```bash
git clone https://github.com/your-username/fangate.git
cd fangate
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set up environment variables:**

Create a `.env` file in the root directory (see [Environment Variables](#environment-variables) section below)

4. **Set up the database:**
```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed quiz questions
npm run seed
```

5. **Start development server:**
```bash
npm run dev
```

Visit [http://localhost:5000](http://localhost:5000)

---

## Environment Variables

Create a `.env` file with the following variables:

### Required Variables

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/fangate?schema=public"
DIRECT_DATABASE_URL="postgresql://user:password@localhost:5432/fangate"

# Last.fm API (Get from https://www.last.fm/api/account/create)
LASTFM_API_KEY=your_lastfm_api_key_here
LASTFM_API_SECRET=your_lastfm_shared_secret_here

# NextAuth
NEXTAUTH_SECRET=your-nextauth-secret-here
NEXTAUTH_URL=http://localhost:5000

# Public URLs
NEXT_PUBLIC_SITE_URL=http://localhost:5000
```

### Optional Variables

```bash
# Spotify OAuth (Optional - for Spotify verification mode)
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret

# Feature Flags
ENABLE_SPOTIFY_VERIFICATION=false  # Set to true to enable Spotify mode
ENABLE_LASTFM_VERIFICATION=true    # Set to false to use mock data

# External Integration
NEXT_PUBLIC_TICKET_REDIRECT_URL=https://tickets.example.com  # Optional ticket sale link
```

### Getting API Keys

#### Last.fm API Key
1. Visit [https://www.last.fm/api/account/create](https://www.last.fm/api/account/create)
2. Fill in application details:
   - **Application name:** FANGATE
   - **Description:** BTS fan verification platform
   - **Callback URL:** `http://localhost:5000` (or your domain)
3. Submit and copy your **API Key** and **Shared Secret**

#### Spotify API Credentials (Optional)
1. Visit [https://developer.spotify.com/dashboard](https://developer.spotify.com/dashboard)
2. Create a new app
3. Add redirect URI: `http://localhost:5000/api/auth/callback/spotify`
4. Copy **Client ID** and **Client Secret**

---

## Database Setup

### Schema Overview

The database includes the following models:

- **User** — User accounts (Last.fm/Spotify)
- **Verification** — Fan verification records and access tokens
- **QuizQuestion** — Quiz question bank
- **QuizAttempt** — Single-player quiz attempts
- **QuizBattle** — Multiplayer battle sessions
- **QuizBattleParticipant** — Battle participants
- **QuizBattleAnswer** — Participant answers in battles
- **Account** — NextAuth provider accounts
- **Session** — NextAuth sessions

### Migrations

```bash
# Create a new migration after schema changes
npx prisma migrate dev --name your_migration_name

# Apply migrations in production
npx prisma migrate deploy

# Reset database (WARNING: deletes all data)
npx prisma migrate reset
```

### Seeding Quiz Questions

```bash
# Seed initial quiz questions
npm run seed
```

This populates the `QuizQuestion` table with BTS trivia questions. Questions are stored with:
- Question text
- 4 multiple choice options
- Correct answer index (0-3)

---

## API Endpoints

### Authentication

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/lastfm` | POST | Authenticate with Last.fm username |

**Request Body:**
```json
{
  "username": "lastfm_username"
}
```

### Verification

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/verification/lastfm` | POST | Calculate Last.fm fan score |
| `/api/verification` | GET | Get Spotify verification (legacy) |

### Quiz (Single-Player)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/quiz` | GET | Fetch quiz questions |
| `/api/quiz` | POST | Submit quiz answers |
| `/api/token` | POST | Generate access token |

**Quiz Submission:**
```json
{
  "userId": "user-uuid",
  "spotifyScore": 150,
  "answers": [0, 2, 1, 3, 0, 1, 2, 3, 0, 1]
}
```

### Quiz Battle (Multiplayer)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/quiz-battle/create` | POST | Create new battle |
| `/api/quiz-battle/join` | POST | Join existing battle |
| `/api/quiz-battle/start` | POST | Start battle (host only) |
| `/api/quiz-battle/ready` | POST | Mark player as ready |
| `/api/quiz-battle/status` | GET | Get battle status (polling) |
| `/api/quiz-battle/complete` | POST | Check/mark battle complete |
| `/api/quiz-battle/answer/batch` | POST | Submit multiple answers |
| `/api/quiz-battle/results` | POST | Get detailed results |

**Create Battle:**
```json
{
  "nickname": "Player1",
  "participantId": "client-generated-uuid"
}
```

**Join Battle:**
```json
{
  "accessCode": "ABC123",
  "nickname": "Player2",
  "participantId": "client-generated-uuid"
}
```

**Batch Answer Submission:**
```json
{
  "battleId": "battle-uuid",
  "participantId": "participant-uuid",
  "answers": [
    { "questionId": "q1-uuid", "answerIndex": 2 },
    { "questionId": "q2-uuid", "answerIndex": 0 }
  ]
}
```

---

## Project Structure

```
fangate/
├── app/                          # Next.js App Router pages
│   ├── api/                      # API route handlers
│   │   ├── auth/                 # Authentication endpoints
│   │   │   └── lastfm/           # Last.fm auth
│   │   ├── quiz/                 # Single-player quiz
│   │   ├── quiz-battle/          # Multiplayer battle APIs
│   │   │   ├── create/           # Create battle
│   │   │   ├── join/             # Join battle
│   │   │   ├── start/            # Start battle
│   │   │   ├── ready/            # Ready status
│   │   │   ├── status/           # Battle polling
│   │   │   ├── complete/         # Battle completion
│   │   │   ├── answer/batch/     # Batch answers
│   │   │   └── results/          # Battle results
│   │   ├── verification/         # Verification APIs
│   │   │   └── lastfm/           # Last.fm verification
│   │   └── token/                # Access token generation
│   ├── quiz/                     # Single-player quiz page
│   ├── quiz-battle/              # Battle pages
│   │   ├── lobby/                # Battle lobby
│   │   ├── play/                 # Battle gameplay
│   │   └── results/              # Battle results
│   ├── verification/             # Verification page
│   ├── layout.tsx                # Root layout (metadata)
│   └── page.tsx                  # Home page (Last.fm auth)
├── lib/                          # Utility libraries
│   ├── auth.ts                   # NextAuth configuration
│   ├── db.ts                     # Prisma client singleton
│   ├── lastfm.ts                 # Last.fm API wrapper
│   ├── scoring.ts                # Fan score calculation
│   └── spotify.ts                # Spotify API wrapper (legacy)
├── prisma/                       # Database schema & migrations
│   ├── schema.prisma             # Database models
│   └── migrations/               # Migration history
├── public/                       # Static assets
│   └── fangate-logo.png          # App branding
├── scripts/                      # Utility scripts
│   └── seedQuiz.ts               # Seed quiz questions
├── .env                          # Environment variables (gitignored)
├── .env.example                  # Environment template
├── package.json                  # Dependencies & scripts
├── tsconfig.json                 # TypeScript configuration
└── tailwind.config.js            # Tailwind CSS configuration
```

---

## Deployment

### Cloudflare Pages (Recommended)

1. **Build for Cloudflare:**
```bash
npm run build:cloudflare
```

2. **Configure Cloudflare Pages:**
   - Build command: `npm run build:cloudflare`
   - Build output directory: `.vercel/output/static`
   - Node version: 20+

3. **Set environment variables** in Cloudflare dashboard

4. **Deploy:**
```bash
# Automatic deployment via GitHub integration
# Or manually upload .vercel/output/static
```

### Vercel

1. **Install Vercel CLI:**
```bash
npm i -g vercel
```

2. **Deploy:**
```bash
vercel
```

3. **Configure environment variables** in Vercel dashboard

### Traditional Hosting

1. **Build production:**
```bash
npm run build
```

2. **Start production server:**
```bash
npm run start
```

3. **Use PM2 or similar process manager:**
```bash
pm2 start npm --name "fangate" -- start
```

---

## Troubleshooting

### Last.fm Issues

**"Last.fm username not found"**
- Verify username spelling
- Check if profile is public (privacy settings)
- Try a different username to test API connectivity

**"Failed to fetch Last.fm data"**
- Verify `LASTFM_API_KEY` is correct in `.env`
- Check API key status at [https://www.last.fm/api/account](https://www.last.fm/api/account)
- Last.fm has a 5 requests/second rate limit per API key
- Set `ENABLE_LASTFM_VERIFICATION=false` to use mock data for testing

### Database Issues

**"Prisma Client is not generated"**
```bash
npx prisma generate
```

**Migration errors**
```bash
# Reset database (WARNING: deletes data)
npx prisma migrate reset

# Or create new migration
npx prisma migrate dev
```

**Connection issues**
- Verify `DATABASE_URL` format: `postgresql://user:pass@host:port/dbname`
- Check PostgreSQL is running
- Ensure database exists

### Quiz Battle Issues

**Players not synchronized**
- Check client-side polling is active (every 2-3 seconds)
- Verify `actualStartTime` is set when all players ready
- Ensure browser allows background polling (not throttled)

**Answers not submitting**
- Check 30-second grace period hasn't expired
- Verify `participantId` matches database record
- Ensure battle status is "active" or recently "completed"

**Questions out of order**
- This is a bug if it happens — questions should be consistent via `questionIds` array
- Check database has preserved question order in battle record

### Build Issues

**"Module not found" errors**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**TypeScript errors**
```bash
# Check TypeScript version
npm list typescript

# Rebuild TypeScript
npm run build
```

---

## Scripts

```bash
# Development
npm run dev              # Start dev server on port 5000

# Production
npm run build            # Build for production
npm run build:cloudflare # Build for Cloudflare Pages
npm run start            # Start production server

# Database
npm run postinstall      # Generate Prisma client (auto-runs after npm install)
npm run seed             # Seed quiz questions

# Code Quality
npm run lint             # Run ESLint
```

---

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## Support the Project

FANGATE is maintained by a student developer. Server costs and API fees are approximately $20/month. If you find this project useful, consider supporting via [Ko-fi](https://ko-fi.com/boy_with_code).

---

## License

This project is licensed under the MIT License. See LICENSE file for details.

---

## Acknowledgments

- Built with love for ARMY
- Creator: [@Boy_With_Code](https://twitter.com/Boy_With_Code)
- BTS trivia questions curated from official sources
- Last.fm API for music data
- Cloudflare Pages for hosting

---

Made with 💜 for ARMY.


