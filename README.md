# FANGATE

**BTS Fan Verification & Quiz Battle Platform**

A comprehensive web application for verifying BTS fandom through multi-factor authentication combining music listening data analysis with interactive trivia challenges. Features single-player verification with time-limited access tokens and real-time multiplayer quiz battles.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Installation](#installation)
- [Configuration](#configuration)
- [Database Schema](#database-schema)
- [API Reference](#api-reference)
- [Project Structure](#project-structure)
- [Deployment](#deployment)
- [Development](#development)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

FANGATE is a fandom verification system designed to authenticate genuine BTS fans (ARMY) through a two-factor evaluation process:

1. **Music Listening Analysis (40%)** - Analyzes Last.fm listening history for BTS and solo member engagement
2. **Trivia Knowledge Assessment (60%)** - Tests knowledge through BTS trivia questions

The platform also includes a multiplayer quiz battle mode for competitive fandom verification and social engagement.

---

## Features

### Verification System

#### Last.fm Integration
- Username-based authentication (no OAuth required)
- Public profile data retrieval via Last.fm REST API
- Comprehensive artist name matching for BTS and all solo members
- Fallback to mock data for development/testing

#### Fan Score Calculation Algorithm

The scoring system analyzes multiple dimensions of music engagement:

| Category | Points | Maximum | Criteria |
|----------|--------|---------|----------|
| Primary Artist | 50 | 50 | BTS detected in top 50 artists (6-month period) |
| Solo Member Engagement | 20/each | 140 | Each solo member in top 50 artists |
| Track Affinity | 10/each | 500 | BTS tracks in top 50 tracks |
| Recent Activity | 1/each | 50 | BTS tracks in last 50 scrobbles |
| Account Tenure | 10 | 10 | Account age > 60 days |
| **Total** | | **200** | |

**Combined Verification Score:**
- Last.fm Score: 40% weight (normalized to 40 points)
- Quiz Score: 60% weight (normalized to 60 points)
- Passing threshold: 70/100 combined points

#### Single-Player Quiz
- 10 randomly selected questions from 1,893-question database
- 4-option multiple choice format
- 5-minute countdown timer
- Bidirectional navigation (previous/next)
- Real-time progress tracking
- Immediate answer verification

#### Access Token Generation
- JWT-based tokens for verified users
- 10-minute expiration (configurable)
- Secure signature using HS256 algorithm
- Token validation endpoint for external integration

### Multiplayer Quiz Battle

#### Battle Management
- Room-based architecture with unique 6-character access codes
- Support for 2-5 concurrent players
- No authentication required (client-generated UUIDs)
- Host-controlled game flow

#### Real-Time Gameplay
- 15 synchronized trivia questions per battle
- 60-second countdown timer with synchronized start
- Client-side polling for state synchronization (2-3s intervals)
- Grace period for late answer submission (30 seconds)
- Live leaderboard with participant tracking

#### Battle Results
- Comprehensive scoring breakdown per player
- Gold/Silver/Bronze medal system for top 3
- Question-by-question answer comparison
- Downloadable scorecard as high-quality JPG
- Social sharing integration

### Social Features

#### Score Card Generation
- Client-side image generation using html2canvas
- High-quality JPG export (95% compression)
- Includes branding, scores, and performance metrics
- No server-side processing required

#### Twitter Integration
- One-click sharing via Twitter Intent API
- Contextual message templates based on results
- Creator attribution
- Manual image attachment workflow

#### Open Graph Metadata
- Rich link previews on social platforms
- Custom OG images for sharing
- SEO-optimized metadata

---

## Architecture

### Application Flow

#### Verification Process
```
User Input (Last.fm username)
    ↓
Fetch & Analyze Listening Data
    ↓
Calculate Fan Score (0-200)
    ↓
Proceed to Quiz (if score sufficient)
    ↓
Answer 10 Trivia Questions
    ↓
Calculate Combined Score
    ↓
Generate Access Token (if passed)
```

#### Multiplayer Battle Flow
```
Create/Join Battle
    ↓
Lobby Phase (wait for participants)
    ↓
Host Starts Battle
    ↓
All Players Mark Ready
    ↓
Synchronized 60s Timer
    ↓
Answer Submission Phase
    ↓
Results & Leaderboard
```

### System Design

#### Frontend Architecture
- Next.js App Router with React Server Components
- Client-side state management for quiz battles
- Polling-based real-time updates
- Responsive design with mobile-first approach

#### Backend Architecture
- Next.js API Routes (serverless functions)
- RESTful API design
- PostgreSQL with Prisma ORM
- Session-based authentication with NextAuth.js

---

## Technology Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 14.2.18 | React framework with App Router |
| React | 18.3.1 | UI library |
| TypeScript | 5.x | Type-safe development |
| Tailwind CSS | 3.4.1 | Utility-first styling |
| Lucide React | 0.460.0 | Icon library |
| html2canvas | 1.4.1 | Client-side image generation |
| react-confetti | 6.1.0 | Celebration animations |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js API Routes | 14.x | Serverless API endpoints |
| Prisma | 5.22.0 | Database ORM |
| PostgreSQL | - | Primary database |
| NextAuth.js | 4.24.10 | Authentication framework |
| Jose | 5.9.6 | JWT token handling |
| Axios | 1.7.8 | HTTP client for external APIs |

### External Services
| Service | Purpose |
|---------|---------|
| Last.fm API | Music listening data |
| Spotify Web API | Alternative authentication (optional) |
| Twitter Intent API | Social sharing |

### DevOps
| Technology | Purpose |
|------------|---------|
| Cloudflare Pages | Edge deployment |
| @cloudflare/next-on-pages | 1.12.0 | Cloudflare adapter |

---

## Installation

### Prerequisites

- Node.js 20 or higher
- PostgreSQL 12 or higher
- Last.fm API key
- Git

### Setup Instructions

1. **Clone the repository**
```bash
git clone https://github.com/your-username/fangate.git
cd fangate
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**

Create a `.env` file in the root directory (see [Configuration](#configuration))

4. **Initialize the database**
```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# Seed quiz questions
npm run seed
```

5. **Start the development server**
```bash
npm run dev
```

The application will be available at [http://localhost:5000](http://localhost:5000)

---

## Configuration

### Required Environment Variables

```bash
# Database Connection
DATABASE_URL="postgresql://user:password@localhost:5432/fangate?schema=public"
DIRECT_DATABASE_URL="postgresql://user:password@localhost:5432/fangate"

# NextAuth Configuration
NEXTAUTH_SECRET="your-cryptographic-secret-minimum-32-chars"
NEXTAUTH_URL="http://localhost:5000"

# Last.fm API Credentials
LASTFM_API_KEY="your_lastfm_api_key"
LASTFM_API_SECRET="your_lastfm_shared_secret"

# Public URLs
NEXT_PUBLIC_SITE_URL="http://localhost:5000"
```

### Optional Environment Variables

```bash
# Spotify OAuth (Optional)
SPOTIFY_CLIENT_ID="your_spotify_client_id"
SPOTIFY_CLIENT_SECRET="your_spotify_client_secret"

# Feature Flags
ENABLE_LASTFM_VERIFICATION=true   # Enable Last.fm verification
ENABLE_SPOTIFY_VERIFICATION=false # Enable Spotify verification

# External Integration
NEXT_PUBLIC_TICKET_REDIRECT_URL="https://tickets.example.com"
```

### Obtaining API Credentials

#### Last.fm API
1. Visit [https://www.last.fm/api/account/create](https://www.last.fm/api/account/create)
2. Provide application details:
   - Application name: FANGATE
   - Description: BTS fan verification platform
   - Callback URL: Your domain
3. Copy the API Key and Shared Secret

#### Spotify API (Optional)
1. Visit [https://developer.spotify.com/dashboard](https://developer.spotify.com/dashboard)
2. Create a new application
3. Add redirect URI: `{YOUR_DOMAIN}/api/auth/callback/spotify`
4. Copy Client ID and Client Secret

---

## Database Schema

### Core Models

#### User
```prisma
model User {
  id              String
  lastfmUsername  String?   @unique
  spotifyId       String?   @unique
  email           String?   @unique
  displayName     String?
  image           String?
  createdAt       DateTime
  accounts        Account[]
  sessions        Session[]
  verifications   Verification[]
  quizAttempts    QuizAttempt[]
}
```

#### Verification
```prisma
model Verification {
  id             String
  userId         String
  user           User         @relation(...)
  fanScore       Int          // Last.fm score (0-200)
  quizPassed     Boolean
  verifiedAt     DateTime?
  passToken      String?      // JWT access token
  tokenExpiresAt DateTime?
  createdAt      DateTime
}
```

#### QuizBattle
```prisma
model QuizBattle {
  id              String
  accessCode      String      @unique    // 6-character room code
  hostId          String
  status          String                 // waiting | active | completed
  questionIds     String[]               // Array of question IDs
  maxPlayers      Int
  startedAt       DateTime?
  actualStartTime DateTime?              // When timer begins
  completedAt     DateTime?
  participants    QuizBattleParticipant[]
  answers         QuizBattleAnswer[]
}
```

#### QuizBattleParticipant
```prisma
model QuizBattleParticipant {
  id            String
  battleId      String
  battle        QuizBattle   @relation(...)
  participantId String                  // Client-generated UUID
  nickname      String
  isHost        Boolean
  score         Int
  isReady       Boolean                 // Question load status
  joinedAt      DateTime
  answers       QuizBattleAnswer[]
}
```

### Relationships

```
User (1) ----< (N) Verification
User (1) ----< (N) QuizAttempt
User (1) ----< (N) Account
User (1) ----< (N) Session

QuizBattle (1) ----< (N) QuizBattleParticipant
QuizBattle (1) ----< (N) QuizBattleAnswer
QuizBattleParticipant (1) ----< (N) QuizBattleAnswer
```

---

## API Reference

### Authentication Endpoints

#### POST /api/auth/lastfm
Authenticates user via Last.fm username.

**Request:**
```json
{
  "username": "lastfm_username"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "lastfmUsername": "lastfm_username",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

### Verification Endpoints

#### POST /api/verification/lastfm
Calculates fan score based on Last.fm listening data.

**Request:**
```json
{
  "username": "lastfm_username"
}
```

**Response:**
```json
{
  "totalScore": 145,
  "breakdown": {
    "topArtists": 50,
    "soloMembers": 60,
    "topTracks": 30,
    "recentListening": 5,
    "accountAge": 0
  },
  "details": {
    "btsArtist": { "name": "BTS", "playcount": "1523" },
    "soloArtists": [...],
    "topTracks": [...],
    "recentTracks": [...]
  }
}
```

### Quiz Endpoints

#### GET /api/quiz
Fetches 10 random quiz questions.

**Response:**
```json
{
  "questions": [
    {
      "id": "uuid",
      "question": "Question text",
      "options": ["A", "B", "C", "D"],
      "correctIndex": 0
    }
  ]
}
```

#### POST /api/quiz
Submits quiz answers and calculates score.

**Request:**
```json
{
  "userId": "user_uuid",
  "lastfmScore": 145,
  "answers": [0, 2, 1, 3, 0, 1, 2, 3, 0, 1]
}
```

**Response:**
```json
{
  "quizScore": 80,
  "combinedScore": 75,
  "passed": true,
  "correctAnswers": 8,
  "token": "jwt_token"
}
```

### Quiz Battle Endpoints

#### POST /api/quiz-battle/create
Creates a new multiplayer battle room.

**Request:**
```json
{
  "nickname": "Player1",
  "participantId": "client_generated_uuid"
}
```

**Response:**
```json
{
  "battleId": "uuid",
  "accessCode": "ABC123",
  "status": "waiting"
}
```

#### POST /api/quiz-battle/join
Joins an existing battle.

**Request:**
```json
{
  "accessCode": "ABC123",
  "nickname": "Player2",
  "participantId": "client_generated_uuid"
}
```

#### GET /api/quiz-battle/status?battleId={uuid}
Polls battle status for real-time updates.

**Response:**
```json
{
  "status": "active",
  "actualStartTime": "2024-01-01T00:00:00Z",
  "participants": [
    {
      "nickname": "Player1",
      "isReady": true,
      "score": 0
    }
  ]
}
```

#### POST /api/quiz-battle/answer/batch
Submits multiple answers efficiently.

**Request:**
```json
{
  "battleId": "uuid",
  "participantId": "uuid",
  "answers": [
    { "questionId": "q1", "answerIndex": 2 },
    { "questionId": "q2", "answerIndex": 0 }
  ]
}
```

#### POST /api/quiz-battle/results
Retrieves detailed battle results.

**Response:**
```json
{
  "battleId": "uuid",
  "leaderboard": [
    {
      "nickname": "Player1",
      "score": 12,
      "rank": 1,
      "medal": "gold"
    }
  ],
  "answers": [...]
}
```

---

## Project Structure

```
fangate/
├── app/                                    # Next.js App Router
│   ├── api/                                # API routes
│   │   ├── auth/
│   │   │   ├── [...nextauth]/             # NextAuth configuration
│   │   │   └── lastfm/                    # Last.fm authentication
│   │   ├── quiz/                          # Single-player quiz API
│   │   ├── quiz-battle/                   # Multiplayer battle API
│   │   │   ├── create/
│   │   │   ├── join/
│   │   │   ├── start/
│   │   │   ├── ready/
│   │   │   ├── status/
│   │   │   ├── complete/
│   │   │   ├── answer/
│   │   │   │   └── batch/                 # Batch answer submission
│   │   │   └── results/
│   │   ├── verification/
│   │   │   └── lastfm/                    # Last.fm verification
│   │   └── token/                         # JWT token generation
│   ├── admin/                             # Admin dashboard
│   ├── quiz/                              # Single-player quiz page
│   ├── quiz-battle/                       # Multiplayer battle pages
│   │   ├── lobby/                         # Battle waiting room
│   │   ├── play/                          # Battle gameplay
│   │   └── results/                       # Battle results
│   ├── success/                           # Post-verification page
│   ├── verification/                      # Verification results page
│   ├── layout.tsx                         # Root layout
│   └── page.tsx                           # Home page
├── lib/                                   # Utility libraries
│   ├── auth.ts                            # NextAuth configuration
│   ├── db.ts                              # Prisma client
│   ├── lastfm.ts                          # Last.fm API wrapper
│   ├── scoring.ts                         # Score calculation
│   └── spotify.ts                         # Spotify API wrapper
├── prisma/                                # Database schema
│   ├── schema.prisma                      # Prisma schema
│   └── migrations/                        # Migration history
├── scripts/                               # Utility scripts
│   └── seedQuiz.ts                        # Quiz seeder
├── public/                                # Static assets
├── .env.example                           # Environment template
├── next.config.js                         # Next.js configuration
├── tailwind.config.js                     # Tailwind configuration
├── tsconfig.json                          # TypeScript configuration
└── package.json                           # Dependencies
```

---

## Deployment

### Cloudflare Pages (Recommended)

**Build Configuration:**
```bash
npm run build:cloudflare
```

**Settings:**
- Build command: `npm run build:cloudflare`
- Build output directory: `.vercel/output/static`
- Node.js version: 20+

**Environment Variables:**
Configure all required variables in the Cloudflare dashboard.

### Vercel

**Deploy via CLI:**
```bash
npm install -g vercel
vercel
```

**Configure:**
- Build command: `npm run build`
- Environment variables in Vercel dashboard

### Traditional Hosting

**Build and start:**
```bash
npm run build
npm run start
```

**Process manager (PM2):**
```bash
pm2 start npm --name "fangate" -- start
pm2 save
pm2 startup
```

---

## Development

### Available Scripts

```bash
npm run dev              # Start development server on port 5000
npm run build            # Build for production
npm run build:cloudflare # Build for Cloudflare Pages
npm run start            # Start production server
npm run lint             # Run ESLint
npm run seed             # Seed quiz questions
```

### Database Operations

```bash
# Generate Prisma client
npx prisma generate

# Create migration
npx prisma migrate dev --name migration_name

# Apply migrations (production)
npx prisma migrate deploy

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# View database in Prisma Studio
npx prisma studio
```

### Feature Flags

Toggle features via environment variables:

```bash
# Use mock Last.fm data for testing
ENABLE_LASTFM_VERIFICATION=false

# Enable Spotify verification mode
ENABLE_SPOTIFY_VERIFICATION=true
```

---

## Contributing

Contributions are welcome. Please follow these guidelines:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/feature-name`
3. Commit changes: `git commit -m 'Add feature'`
4. Push to branch: `git push origin feature/feature-name`
5. Submit a pull request

### Code Style

- Use TypeScript for all new code
- Follow existing code patterns
- Run linting before committing: `npm run lint`
- Test thoroughly before submitting PRs

---

## License

This project is licensed under the MIT License.

---

## Credits

- Developer: [@Boy_With_Code](https://twitter.com/Boy_With_Code)
- Built with Next.js, TypeScript, and Tailwind CSS
- Quiz data sourced from official BTS content
- Last.fm API integration for music data analysis
