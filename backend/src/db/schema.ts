import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(__dirname, '..', '..', 'criclive.db');

const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initializeDatabase(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS tournaments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      format TEXT NOT NULL CHECK(format IN ('T20', 'ODI', 'Test')),
      tournament_type TEXT NOT NULL CHECK(tournament_type IN ('League', 'Knockout', 'Round Robin')),
      start_date TEXT,
      venue TEXT,
      num_teams INTEGER DEFAULT 2,
      status TEXT DEFAULT 'upcoming' CHECK(status IN ('upcoming', 'in_progress', 'completed')),
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS teams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      tournament_id INTEGER,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS players (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      team_id INTEGER,
      role TEXT CHECK(role IN ('batsman', 'bowler', 'all-rounder', 'wicket-keeper')),
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS matches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tournament_id INTEGER,
      team1_id INTEGER NOT NULL,
      team2_id INTEGER NOT NULL,
      overs INTEGER NOT NULL,
      venue TEXT,
      toss_winner_id INTEGER,
      toss_decision TEXT CHECK(toss_decision IN ('bat', 'bowl')),
      status TEXT DEFAULT 'upcoming' CHECK(status IN ('upcoming', 'in_progress', 'completed')),
      winner_id INTEGER,
      match_date TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE SET NULL,
      FOREIGN KEY (team1_id) REFERENCES teams(id),
      FOREIGN KEY (team2_id) REFERENCES teams(id),
      FOREIGN KEY (toss_winner_id) REFERENCES teams(id),
      FOREIGN KEY (winner_id) REFERENCES teams(id)
    );

    CREATE TABLE IF NOT EXISTS innings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      match_id INTEGER NOT NULL,
      batting_team_id INTEGER NOT NULL,
      bowling_team_id INTEGER NOT NULL,
      innings_number INTEGER NOT NULL,
      total_runs INTEGER DEFAULT 0,
      total_wickets INTEGER DEFAULT 0,
      total_overs REAL DEFAULT 0,
      extras INTEGER DEFAULT 0,
      is_completed INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
      FOREIGN KEY (batting_team_id) REFERENCES teams(id),
      FOREIGN KEY (bowling_team_id) REFERENCES teams(id)
    );

    CREATE TABLE IF NOT EXISTS balls (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      innings_id INTEGER NOT NULL,
      over_number INTEGER NOT NULL,
      ball_number INTEGER NOT NULL,
      batsman_id INTEGER NOT NULL,
      bowler_id INTEGER NOT NULL,
      runs INTEGER DEFAULT 0,
      is_extra INTEGER DEFAULT 0,
      extra_type TEXT CHECK(extra_type IN ('wide', 'no-ball', 'bye', 'leg-bye', NULL)),
      extra_runs INTEGER DEFAULT 0,
      is_wicket INTEGER DEFAULT 0,
      wicket_type TEXT CHECK(wicket_type IN ('bowled', 'caught', 'lbw', 'run_out', 'stumped', 'hit_wicket', NULL)),
      dismissed_player_id INTEGER,
      fielder_id INTEGER,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (innings_id) REFERENCES innings(id) ON DELETE CASCADE,
      FOREIGN KEY (batsman_id) REFERENCES players(id),
      FOREIGN KEY (bowler_id) REFERENCES players(id),
      FOREIGN KEY (dismissed_player_id) REFERENCES players(id),
      FOREIGN KEY (fielder_id) REFERENCES players(id)
    );

    CREATE TABLE IF NOT EXISTS player_match_stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_id INTEGER NOT NULL,
      match_id INTEGER NOT NULL,
      innings_id INTEGER NOT NULL,
      runs_scored INTEGER DEFAULT 0,
      balls_faced INTEGER DEFAULT 0,
      fours INTEGER DEFAULT 0,
      sixes INTEGER DEFAULT 0,
      overs_bowled REAL DEFAULT 0,
      runs_conceded INTEGER DEFAULT 0,
      wickets_taken INTEGER DEFAULT 0,
      maidens INTEGER DEFAULT 0,
      catches INTEGER DEFAULT 0,
      run_outs INTEGER DEFAULT 0,
      stumpings INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
      FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
      FOREIGN KEY (innings_id) REFERENCES innings(id) ON DELETE CASCADE
    );
  `);
}

export default db;
