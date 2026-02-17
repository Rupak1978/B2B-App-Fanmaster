# CricLive - Live Scoring & Stats

A mobile-first cricket scoring application built with Flutter for local matches and tournaments. Designed for extreme simplicity for the scorer with full flexibility for custom match formats.

## Architecture

```
criclive/          # Flutter mobile app (Android first)
  lib/
    models/        # Data models (BallEvent, Match, Innings, etc.)
    database/      # SQLite offline-first database layer
    providers/     # State management (Provider pattern)
    screens/       # App screens (Home, Setup, Scoring, Summary, etc.)
    widgets/       # Reusable widgets (ScoreDisplay, ScoringControls, etc.)
    services/      # Business logic (RulesParser, StatsCalculator, SyncService)
    utils/         # Constants, enums

backend/           # Node.js API server
  src/
    routes/        # REST API endpoints
    models/        # Database connection
    websocket/     # WebSocket for live audience
  database/
    schema.sql     # PostgreSQL schema
    seed.sql       # Demo data
```

## Scorer Flow

The app follows a ONE STEP AT A TIME philosophy. Here's the complete scorer flow:

### 1. Match Setup
1. **Enter format** - Type or speak: "8 overs, 6 players, power ball in last over"
2. **Review rules** - System parses input, shows detected rules with toggle edits
3. **Create teams** - Enter team names and player names
4. **Toss** - Select toss winner and batting/bowling decision
5. **Opening players** - Select striker, non-striker, and opening bowler
6. Press **Start Match**

### 2. Live Scoring (Split Screen)
The scoring screen has a mandatory split layout:

**TOP HALF (read-only display):**
- Team score: Runs/Wickets (Overs)
- Current Run Rate / Required Run Rate
- Striker: runs(balls) 4s 6s
- Non-striker: runs(balls)
- Bowler: overs-runs-wickets
- This over: ball-by-ball symbols
- Target info (2nd innings)
- Power Ball Active indicator

**BOTTOM HALF (input controls):**
- Run buttons: 0, 1, 2, 3, 4, 6, +Custom
- Extras button → Wide, No-ball, Bye, Leg-bye
- Wicket button → Bowled, Caught, LBW, Run Out, Stumped, Hit Wicket, Retired Hurt
- Power Ball toggle (when available)
- Undo button (always visible)

### 3. Micro Flows
- **Wide**: 1 run + extra ball, optional additional runs, Power Ball multiplier applies
- **No Ball**: 1 run + extra ball, asks runs off bat (0-6), Power Ball multiplier applies
- **Wicket**: Select type → select fielder (if caught/stumped) → select new batsman
- **Run Out**: Select who's out (striker/non-striker) → runs completed → new batsman
- **Penalty**: Manual penalty with team, runs (+/-), and reason

### 4. Power Ball
- Activated via toggle button (only when rules allow)
- ALL runs are doubled (bat runs + extras)
- Wicket on Power Ball = -5 runs deducted after doubling
- Prominent red indicator when active
- Auto-deactivates after each delivery

### 5. End of Innings / Match
- Auto-detects all out, overs completed, or target chased
- First innings end → prompts for 2nd innings openers + bowler
- Match end → shows result and full scorecard

## Data Model

All stats are derived from **BallEvents** - the single source of truth. Each ball event captures:
- Match/Innings/Over/Ball identifiers
- Legal/Illegal status
- Striker, Non-striker, Bowler
- Runs (bat + extras), Extra type, Boundary type
- Wicket details (type, fielder, dismissed player)
- Power Ball state (active, multiplier, deduction)
- Timestamp

## Tournament Features

- Points: Win=2, Tie=1, Loss=0
- NRR: Standard limited-overs calculation (all-out = full quota overs)
- Points table with team standings
- Match history per tournament

## Backend API

| Endpoint | Method | Description |
|---|---|---|
| `/api/health` | GET | Health check |
| `/api/matches` | GET | List all matches |
| `/api/matches/:id` | GET | Full match details |
| `/api/matches/:id/live` | GET | Live score snapshot |
| `/api/matches` | POST | Create match |
| `/api/teams` | GET/POST | Teams CRUD |
| `/api/tournaments` | GET/POST | Tournament CRUD |
| `/api/tournaments/:id/standings` | GET | Points table |
| `/api/ball-events` | POST | Record ball event |
| `/api/ball-events/:id` | DELETE | Undo (delete) ball |
| `/ws?matchId=X` | WS | Live WebSocket |

## Setup

### Flutter App
```bash
cd criclive
flutter pub get
flutter run
```

### Backend
```bash
cd backend
cp .env.example .env
npm install
# Set up PostgreSQL database
psql -d criclive -f database/schema.sql
psql -d criclive -f database/seed.sql
npm start
```

## Tech Stack

- **Frontend**: Flutter 3.x, Provider, SQLite (sqflite), Material 3
- **Backend**: Node.js, Express, WebSocket (ws), PostgreSQL
- **Offline-first**: SQLite for local storage, sync when connected
