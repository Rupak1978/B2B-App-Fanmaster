import { Request, Response } from 'express';
import db from '../db/schema';

export function getAllPlayers(req: Request, res: Response): void {
  const { team_id } = req.query;
  let players;
  if (team_id) {
    players = db.prepare(
      'SELECT p.*, t.name as team_name FROM players p LEFT JOIN teams t ON p.team_id = t.id WHERE p.team_id = ? ORDER BY p.name'
    ).all(team_id);
  } else {
    players = db.prepare(
      'SELECT p.*, t.name as team_name FROM players p LEFT JOIN teams t ON p.team_id = t.id ORDER BY p.name'
    ).all();
  }
  res.json(players);
}

export function getPlayer(req: Request, res: Response): void {
  const player = db.prepare(
    'SELECT p.*, t.name as team_name FROM players p LEFT JOIN teams t ON p.team_id = t.id WHERE p.id = ?'
  ).get(req.params.id);
  if (!player) {
    res.status(404).json({ error: 'Player not found' });
    return;
  }
  res.json(player);
}

export function createPlayer(req: Request, res: Response): void {
  const { name, team_id, role } = req.body;
  if (!name) {
    res.status(400).json({ error: 'name is required' });
    return;
  }
  const result = db.prepare(
    'INSERT INTO players (name, team_id, role) VALUES (?, ?, ?)'
  ).run(name, team_id || null, role || null);
  const player = db.prepare('SELECT * FROM players WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(player);
}

export function getPlayerStats(req: Request, res: Response): void {
  const player = db.prepare(
    'SELECT p.*, t.name as team_name FROM players p LEFT JOIN teams t ON p.team_id = t.id WHERE p.id = ?'
  ).get(req.params.id);
  if (!player) {
    res.status(404).json({ error: 'Player not found' });
    return;
  }

  const battingStats = db.prepare(`
    SELECT
      COUNT(DISTINCT pms.match_id) as matches,
      COALESCE(SUM(pms.runs_scored), 0) as total_runs,
      COALESCE(SUM(pms.balls_faced), 0) as total_balls_faced,
      COALESCE(SUM(pms.fours), 0) as total_fours,
      COALESCE(SUM(pms.sixes), 0) as total_sixes,
      MAX(pms.runs_scored) as highest_score
    FROM player_match_stats pms
    WHERE pms.player_id = ? AND pms.balls_faced > 0
  `).get(req.params.id) as Record<string, number>;

  const bowlingStats = db.prepare(`
    SELECT
      COALESCE(SUM(pms.overs_bowled), 0) as total_overs,
      COALESCE(SUM(pms.runs_conceded), 0) as total_runs_conceded,
      COALESCE(SUM(pms.wickets_taken), 0) as total_wickets,
      COALESCE(SUM(pms.maidens), 0) as total_maidens,
      MAX(pms.wickets_taken) as best_wickets,
      MIN(CASE WHEN pms.wickets_taken > 0 THEN pms.runs_conceded END) as best_figures_runs
    FROM player_match_stats pms
    WHERE pms.player_id = ? AND pms.overs_bowled > 0
  `).get(req.params.id) as Record<string, number>;

  const fiveWicketHauls = db.prepare(`
    SELECT COUNT(*) as count FROM player_match_stats
    WHERE player_id = ? AND wickets_taken >= 5
  `).get(req.params.id) as Record<string, number>;

  const matchHistory = db.prepare(`
    SELECT pms.*, m.match_date, m.venue,
           t1.name as team1_name, t2.name as team2_name
    FROM player_match_stats pms
    JOIN matches m ON pms.match_id = m.id
    JOIN teams t1 ON m.team1_id = t1.id
    JOIN teams t2 ON m.team2_id = t2.id
    WHERE pms.player_id = ?
    ORDER BY m.match_date DESC
  `).all(req.params.id);

  const batting_average = battingStats.total_balls_faced > 0
    ? (battingStats.total_runs / Math.max(1, battingStats.matches)).toFixed(2)
    : '0.00';
  const strike_rate = battingStats.total_balls_faced > 0
    ? ((battingStats.total_runs / battingStats.total_balls_faced) * 100).toFixed(2)
    : '0.00';
  const bowling_economy = bowlingStats.total_overs > 0
    ? (bowlingStats.total_runs_conceded / bowlingStats.total_overs).toFixed(2)
    : '0.00';
  const bowling_average = bowlingStats.total_wickets > 0
    ? (bowlingStats.total_runs_conceded / bowlingStats.total_wickets).toFixed(2)
    : '0.00';

  res.json({
    ...player as object,
    batting: {
      matches: battingStats.matches,
      runs: battingStats.total_runs,
      balls_faced: battingStats.total_balls_faced,
      fours: battingStats.total_fours,
      sixes: battingStats.total_sixes,
      highest_score: battingStats.highest_score || 0,
      average: batting_average,
      strike_rate: strike_rate,
    },
    bowling: {
      overs: bowlingStats.total_overs,
      runs_conceded: bowlingStats.total_runs_conceded,
      wickets: bowlingStats.total_wickets,
      maidens: bowlingStats.total_maidens,
      economy: bowling_economy,
      average: bowling_average,
      best_wickets: bowlingStats.best_wickets || 0,
      best_figures_runs: bowlingStats.best_figures_runs || 0,
      five_wicket_hauls: fiveWicketHauls.count,
    },
    match_history: matchHistory,
  });
}
