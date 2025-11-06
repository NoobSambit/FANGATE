# FanGate - BTS Fan Verification System

## Overview
FanGate is a production-ready web application that verifies real BTS fans before granting access to concert ticket purchases. The system uses Spotify OAuth authentication, listening history analysis, and a BTS trivia quiz to ensure only genuine ARMY members can access exclusive ticket sales.

## Project Architecture

### Tech Stack
- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with Spotify OAuth
- **Token Generation**: jose (JWT)
- **Deployment**: Vercel-ready configuration

### Database Schema
- **User**: Stores Spotify user information and authentication data
- **Account**: NextAuth account linking (OAuth tokens)
- **Session**: NextAuth session management
- **Verification**: Fan score and verification status
- **QuizQuestion**: BTS trivia questions (seeded from quiz.json)
- **QuizAttempt**: User quiz scores and attempts

## Features Implemented

### 1. Landing Page (/)
- Premium BTS-themed design with purple/neon gradients
- Glass-morphism effects
- Spotify OAuth login button
- Verification process explanation
- Responsive design

### 2. Spotify Integration
- OAuth authentication via NextAuth
- Fetches user's top artists, top tracks, and recently played songs
- Analyzes BTS listening patterns
- Fan score calculation algorithm:
  - +50 points: BTS in top artists
  - +20 points: Per solo member in top artists
  - +10 points: Per BTS track in top songs
  - +30 points: Recent BTS listening (last 30 days)
  - +10 points: Account age > 60 days
  - **Minimum 70 points required to take quiz**

### 3. Verification Page (/verification)
- Analyzes Spotify listening history
- Displays fan score
- Grants quiz access if score >= 70

### 4. Quiz System (/quiz)
- 10 random BTS trivia questions from database
- 10-minute timer with countdown
- Real-time progress tracking
- Answer selection with visual feedback
- Automatic submission on timeout
- **70% passing score (7/10 questions) required**

### 5. Success Page (/success)
- Confetti animation for passed users
- JWT token generation (10-minute expiration)
- Secure redirect to ticket purchase page
- Failure feedback for those who don't pass

### 6. Admin Panel (/admin)
- Protected by ADMIN_EMAIL environment variable
- User verification statistics
- Quiz scores and pass rates
- CSV export functionality
- Real-time data dashboard

## Quiz Data Management

### Quiz Seeding
- **File**: `data/quiz.json` - Contains 15 BTS trivia questions
- **Script**: `scripts/seedQuiz.ts` - Seeds database with questions
- **Command**: `npm run seed`
- **Fallback**: 5 default questions inserted if quiz.json is unavailable
- **Duplicate Protection**: Only seeds if database has 0 questions

### BTS Artist IDs (Hardcoded)
- Main Group: `3Nrfpe0tUJi4K4DXYWgMUX`
- Solo Members: Multiple Spotify artist IDs tracked for individual members

## API Routes

- `/api/auth/[...nextauth]` - NextAuth authentication
- `/api/verification` - POST - Analyze Spotify data and calculate fan score
- `/api/quiz` - GET - Fetch 10 random quiz questions
- `/api/quiz` - POST - Submit quiz answers and get score
- `/api/token` - POST - Generate JWT token for verified users
- `/api/admin` - GET - Fetch all user verification data (admin only)

## Environment Variables

Required variables (see `.env.example`):
```
DATABASE_URL - PostgreSQL connection string
SPOTIFY_CLIENT_ID - Spotify OAuth app client ID
SPOTIFY_CLIENT_SECRET - Spotify OAuth app secret
NEXTAUTH_URL - Application URL (http://localhost:5000 for dev)
NEXTAUTH_SECRET - Secret for NextAuth session encryption
TICKET_REDIRECT_URL - URL to redirect verified fans
ADMIN_EMAIL - Email address for admin panel access
```

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment Variables
Copy `.env.example` to `.env` and fill in all values:
- Create Spotify OAuth app at https://developer.spotify.com/dashboard
- Set callback URL to: `http://localhost:5000/api/auth/callback/spotify`
- Generate NEXTAUTH_SECRET: `openssl rand -base64 32`

### 3. Initialize Database
```bash
npx prisma db push
npm run seed
```

### 4. Run Development Server
```bash
npm run dev
```

Application runs at: http://localhost:5000

### 5. Deploy to Vercel
```bash
npm run build
vercel deploy
```

## Project Structure

```
/app                    # Next.js app directory
  /api                  # API routes
    /auth/[...nextauth] # NextAuth endpoints
    /verification       # Fan score calculation
    /quiz               # Quiz questions and submission
    /token              # JWT generation
    /admin              # Admin data endpoint
  /verification         # Verification page
  /quiz                 # Quiz taking page
  /success              # Success/failure results page
  /admin                # Admin dashboard page
  layout.tsx            # Root layout with session provider
  page.tsx              # Landing page
  globals.css           # Global styles and BTS theme

/components             # React components
  SessionProvider.tsx   # NextAuth session provider wrapper

/lib                    # Utility libraries
  auth.ts               # NextAuth configuration
  prisma.ts             # Prisma client singleton
  spotify.ts            # Spotify API integration

/prisma                 # Database
  schema.prisma         # Database schema definition

/data                   # Static data
  quiz.json             # BTS quiz questions

/scripts                # Utility scripts
  seedQuiz.ts           # Database seeding script

/public                 # Static assets (if needed)
```

## Key Features

### Security
- JWT tokens expire in 10 minutes
- Admin panel protected by email verification
- Spotify OAuth secure authentication
- Environment variables for sensitive data
- Session-based authentication with NextAuth

### User Experience
- Premium BTS-themed design
- Responsive across all devices
- Real-time feedback
- Smooth animations and transitions
- Confetti celebration for passing users
- Clear error messages

### Performance
- Server-side rendering with Next.js
- Optimized database queries with Prisma
- Efficient Spotify API calls
- Automatic client-side caching

## Development Notes

### Spotify API Scopes Required
- `user-read-email` - Get user email
- `user-read-private` - Get user profile
- `user-top-read` - Get top artists and tracks
- `user-read-recently-played` - Get recently played tracks

### BTS Quiz Questions
Questions are loaded from `data/quiz.json`. You can update this file to add more questions. After updating, run `npm run seed` to reload them into the database.

### Fan Score Algorithm
The algorithm is designed to:
1. Prioritize BTS group listening
2. Recognize solo member support
3. Value recent engagement
4. Account for account authenticity

## Recent Changes

- **2024-11-06**: Initial project setup
  - Implemented full Next.js 14 application
  - Configured Prisma with PostgreSQL
  - Set up NextAuth with Spotify OAuth
  - Created all verification pages and API routes
  - Built admin dashboard
  - Added quiz system with seeding
  - Deployed BTS-themed UI with purple/neon gradients

## User Preferences

*No specific user preferences recorded yet*

## Deployment Configuration

The application is configured for Vercel deployment:
- Server runs on port 5000 (required for Replit preview)
- All environment variables must be set in Vercel dashboard
- Database migrations handled via `prisma db push`
- PostCSS and Tailwind configured
- TypeScript strict mode enabled

## Future Enhancements

Potential features for next phase:
- Rate limiting to prevent abuse
- Email notifications for verified users
- Analytics dashboard for conversion rates
- User verification history
- Multi-language support
- Additional quiz categories
- Social sharing of verification status
