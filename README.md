# CricLive

Live Cricket Scoring & Stats application.

## Tech Stack

- **Frontend:** React + TypeScript + Vite + Tailwind CSS
- **Backend:** Node.js + Express + TypeScript
- **Database:** SQLite (better-sqlite3)
- **Deployment:** Single deployable app (backend serves frontend build)

## Features

- Tournament management (League, Knockout, Round Robin)
- Team & player management with voice input (Web Speech API)
- Ball-by-ball live scoring with real-time scorecard
- Extras (wide, no-ball, bye, leg-bye) and wicket types (bowled, caught, LBW, run out, stumped, hit wicket)
- Player stats: batting average, strike rate, bowling economy, best figures, 5-wicket hauls
- Mobile-first responsive design with Shopify-style clean UI
- Bottom navigation: Home, Tournaments, Score, Players, Records

## Getting Started

### Install dependencies

```bash
npm run install:all
```

### Development (frontend + backend concurrently)

```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

### Production build

```bash
npm run build
npm start
```

The backend serves the frontend build at http://localhost:3001.

## API Routes

| Method | Route | Description |
|--------|-------|-------------|
| GET | /api/tournaments | List all tournaments |
| POST | /api/tournaments | Create tournament |
| GET | /api/tournaments/:id | Get tournament details |
| GET | /api/teams | List teams |
| POST | /api/teams | Create team |
| GET | /api/teams/:id | Get team with players |
| GET | /api/players | List players |
| POST | /api/players | Create player |
| GET | /api/players/:id/stats | Get player stats |
| GET | /api/matches | List matches |
| POST | /api/matches | Create match |
| POST | /api/matches/:id/start | Start match |
| POST | /api/matches/:id/ball | Record a ball |
| GET | /api/matches/:id/scorecard | Get full scorecard |
| POST | /api/matches/:id/end | End match |

## Database

SQLite database with tables: `tournaments`, `teams`, `players`, `matches`, `innings`, `balls`, `player_match_stats`.
