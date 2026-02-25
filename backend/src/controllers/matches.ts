import { Request, Response } from 'express';
import db from '../db/schema';

export function getAllMatches(_req: Request, res: Response): void {
  const matches = db.prepare(`
    SELECT m.*, t1.name as team1_name, t2.name as team2_name,
           tw.name as toss_winner_name, w.name as winner_name
    FROM matches m
    LEFT JOIN teams t1 ON m.team1_id = t1.id
    LEFT JOIN teams t2 ON m.team2_id = t2.id
    LEFT JOIN teams tw ON m.toss_winner_id = tw.id
    LEFT JOIN teams w ON m.winner_id = w.id
    ORDER BY m.created_at DESC
  `).all();
  res.json(matches);
}

export function createMatch(req: Request, res: Response): void {
  const { tournament_id, team1_id, team2_id, overs, venue, toss_winner_id, toss_decision, match_date } = req.body;
  if (!team1_id || !team2_id || !overs) {
    res.status(400).json({ error: 'team1_id, team2_id, and overs are required' });
    return;
  }
  const result = db.prepare(
    `INSERT INTO matches (tournament_id, team1_id, team2_id, overs, venue, toss_winner_id, toss_decision, match_date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(tournament_id || null, team1_id, team2_id, overs, venue || null, toss_winner_id || null, toss_decision || null, match_date || null);
  const match = db.prepare('SELECT * FROM matches WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(match);
}

export function startMatch(req: Request, res: Response): void {
  const matchId = req.params.id;
  const match = db.prepare('SELECT * FROM matches WHERE id = ?').get(matchId) as Record<string, number | string | null> | undefined;
  if (!match) {
    res.status(404).json({ error: 'Match not found' });
    return;
  }

  const { batting_team_id } = req.body;
  if (!batting_team_id) {
    res.status(400).json({ error: 'batting_team_id is required' });
    return;
  }

  const bowling_team_id = batting_team_id === match.team1_id ? match.team2_id : match.team1_id;

  db.prepare('UPDATE matches SET status = ? WHERE id = ?').run('in_progress', matchId);

  const result = db.prepare(
    'INSERT INTO innings (match_id, batting_team_id, bowling_team_id, innings_number) VALUES (?, ?, ?, ?)'
  ).run(matchId, batting_team_id, bowling_team_id, 1);

  const innings = db.prepare('SELECT * FROM innings WHERE id = ?').get(result.lastInsertRowid);

  // Initialize player_match_stats for all players in both teams
  const battingPlayers = db.prepare('SELECT id FROM players WHERE team_id = ?').all(batting_team_id) as { id: number }[];
  const bowlingPlayers = db.prepare('SELECT id FROM players WHERE team_id = ?').all(bowling_team_id) as { id: number }[];

  const insertStats = db.prepare(
    'INSERT INTO player_match_stats (player_id, match_id, innings_id) VALUES (?, ?, ?)'
  );

  for (const p of [...battingPlayers, ...bowlingPlayers]) {
    insertStats.run(p.id, matchId, result.lastInsertRowid);
  }

  res.json({ match: db.prepare('SELECT * FROM matches WHERE id = ?').get(matchId), innings });
}

export function recordBall(req: Request, res: Response): void {
  const matchId = req.params.id;
  const {
    innings_id, batsman_id, bowler_id, runs, is_extra, extra_type,
    extra_runs, is_wicket, wicket_type, dismissed_player_id, fielder_id
  } = req.body;

  if (!innings_id || !batsman_id || !bowler_id) {
    res.status(400).json({ error: 'innings_id, batsman_id, and bowler_id are required' });
    return;
  }

  const innings = db.prepare('SELECT * FROM innings WHERE id = ? AND match_id = ?').get(innings_id, matchId) as Record<string, number> | undefined;
  if (!innings) {
    res.status(404).json({ error: 'Innings not found' });
    return;
  }

  // Calculate current over and ball
  const isWideOrNoBall = is_extra && (extra_type === 'wide' || extra_type === 'no-ball');

  const lastBall = db.prepare(
    'SELECT over_number, ball_number FROM balls WHERE innings_id = ? AND is_extra = 0 OR (innings_id = ? AND extra_type NOT IN (\'wide\', \'no-ball\')) ORDER BY id DESC LIMIT 1'
  ).get(innings_id, innings_id) as { over_number: number; ball_number: number } | undefined;

  let overNumber = 0;
  let ballNumber = 1;

  if (lastBall) {
    if (lastBall.ball_number >= 6) {
      overNumber = lastBall.over_number + 1;
      ballNumber = 1;
    } else {
      overNumber = lastBall.over_number;
      ballNumber = lastBall.ball_number + 1;
    }
  }

  // For wides/no-balls, don't increment ball count
  if (isWideOrNoBall) {
    if (lastBall) {
      overNumber = lastBall.ball_number >= 6 ? lastBall.over_number + 1 : lastBall.over_number;
      ballNumber = lastBall.ball_number >= 6 ? 0 : lastBall.ball_number;
    } else {
      ballNumber = 0;
    }
  }

  const totalRuns = (runs || 0) + (extra_runs || 0);

  db.prepare(`
    INSERT INTO balls (innings_id, over_number, ball_number, batsman_id, bowler_id, runs, is_extra, extra_type, extra_runs, is_wicket, wicket_type, dismissed_player_id, fielder_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    innings_id, overNumber, ballNumber, batsman_id, bowler_id,
    runs || 0, is_extra ? 1 : 0, extra_type || null, extra_runs || 0,
    is_wicket ? 1 : 0, wicket_type || null, dismissed_player_id || null, fielder_id || null
  );

  // Update innings totals
  const newExtras = innings.extras + (is_extra ? (extra_runs || 0) + (extra_type === 'wide' || extra_type === 'no-ball' ? 1 : 0) : 0);
  const newRuns = innings.total_runs + totalRuns + (is_extra && (extra_type === 'wide' || extra_type === 'no-ball') ? 1 : 0);
  const newWickets = innings.total_wickets + (is_wicket ? 1 : 0);

  // Calculate overs as decimal (e.g., 2.3 = 2 overs and 3 balls)
  const legalBalls = db.prepare(
    `SELECT COUNT(*) as count FROM balls WHERE innings_id = ? AND (is_extra = 0 OR extra_type IN ('bye', 'leg-bye'))`
  ).get(innings_id) as { count: number };
  const oversCompleted = Math.floor(legalBalls.count / 6);
  const ballsInOver = legalBalls.count % 6;
  const newOvers = parseFloat(`${oversCompleted}.${ballsInOver}`);

  db.prepare(
    'UPDATE innings SET total_runs = ?, total_wickets = ?, total_overs = ?, extras = ? WHERE id = ?'
  ).run(newRuns, newWickets, newOvers, newExtras, innings_id);

  // Update batsman stats
  if (!is_extra || extra_type === 'bye' || extra_type === 'leg-bye') {
    const batsmanRuns = extra_type === 'bye' || extra_type === 'leg-bye' ? 0 : (runs || 0);
    db.prepare(`
      UPDATE player_match_stats SET
        runs_scored = runs_scored + ?,
        balls_faced = balls_faced + 1,
        fours = fours + ?,
        sixes = sixes + ?
      WHERE player_id = ? AND innings_id = ?
    `).run(batsmanRuns, batsmanRuns === 4 ? 1 : 0, batsmanRuns === 6 ? 1 : 0, batsman_id, innings_id);
  }

  // Update bowler stats
  const bowlerRunsConceded = (extra_type === 'bye' || extra_type === 'leg-bye') ? 0 : totalRuns + (is_extra && (extra_type === 'wide' || extra_type === 'no-ball') ? 1 : 0);
  const isLegalDelivery = !isWideOrNoBall;

  if (isLegalDelivery) {
    // Get bowler's current legal balls in this innings
    const bowlerBalls = db.prepare(`
      SELECT COUNT(*) as count FROM balls
      WHERE innings_id = ? AND bowler_id = ? AND (is_extra = 0 OR extra_type IN ('bye', 'leg-bye'))
    `).get(innings_id, bowler_id) as { count: number };
    const bowlerOvers = parseFloat(`${Math.floor(bowlerBalls.count / 6)}.${bowlerBalls.count % 6}`);

    db.prepare(`
      UPDATE player_match_stats SET
        runs_conceded = runs_conceded + ?,
        wickets_taken = wickets_taken + ?,
        overs_bowled = ?
      WHERE player_id = ? AND innings_id = ?
    `).run(bowlerRunsConceded, is_wicket ? 1 : 0, bowlerOvers, bowler_id, innings_id);
  } else {
    db.prepare(`
      UPDATE player_match_stats SET
        runs_conceded = runs_conceded + ?
      WHERE player_id = ? AND innings_id = ?
    `).run(bowlerRunsConceded, bowler_id, innings_id);
  }

  // Update fielder stats if applicable
  if (is_wicket && fielder_id) {
    if (wicket_type === 'caught') {
      db.prepare('UPDATE player_match_stats SET catches = catches + 1 WHERE player_id = ? AND innings_id = ?')
        .run(fielder_id, innings_id);
    } else if (wicket_type === 'run_out') {
      db.prepare('UPDATE player_match_stats SET run_outs = run_outs + 1 WHERE player_id = ? AND innings_id = ?')
        .run(fielder_id, innings_id);
    } else if (wicket_type === 'stumped') {
      db.prepare('UPDATE player_match_stats SET stumpings = stumpings + 1 WHERE player_id = ? AND innings_id = ?')
        .run(fielder_id, innings_id);
    }
  }

  // Check if innings is completed (10 wickets or overs completed)
  const match = db.prepare('SELECT overs FROM matches WHERE id = ?').get(matchId) as { overs: number };
  if (newWickets >= 10 || oversCompleted >= match.overs) {
    db.prepare('UPDATE innings SET is_completed = 1 WHERE id = ?').run(innings_id);
  }

  const updatedInnings = db.prepare('SELECT * FROM innings WHERE id = ?').get(innings_id);
  res.json(updatedInnings);
}

export function startSecondInnings(req: Request, res: Response): void {
  const matchId = req.params.id;
  const match = db.prepare('SELECT * FROM matches WHERE id = ?').get(matchId) as Record<string, number | string | null> | undefined;
  if (!match) {
    res.status(404).json({ error: 'Match not found' });
    return;
  }

  const firstInnings = db.prepare('SELECT * FROM innings WHERE match_id = ? AND innings_number = 1').get(matchId) as Record<string, number> | undefined;
  if (!firstInnings || !firstInnings.is_completed) {
    res.status(400).json({ error: 'First innings must be completed' });
    return;
  }

  const existingSecond = db.prepare('SELECT * FROM innings WHERE match_id = ? AND innings_number = 2').get(matchId);
  if (existingSecond) {
    res.status(400).json({ error: 'Second innings already exists' });
    return;
  }

  const result = db.prepare(
    'INSERT INTO innings (match_id, batting_team_id, bowling_team_id, innings_number) VALUES (?, ?, ?, ?)'
  ).run(matchId, firstInnings.bowling_team_id, firstInnings.batting_team_id, 2);

  // Initialize player_match_stats for second innings
  const battingPlayers = db.prepare('SELECT id FROM players WHERE team_id = ?').all(firstInnings.bowling_team_id) as { id: number }[];
  const bowlingPlayers = db.prepare('SELECT id FROM players WHERE team_id = ?').all(firstInnings.batting_team_id) as { id: number }[];

  const insertStats = db.prepare(
    'INSERT INTO player_match_stats (player_id, match_id, innings_id) VALUES (?, ?, ?)'
  );
  for (const p of [...battingPlayers, ...bowlingPlayers]) {
    insertStats.run(p.id, matchId, result.lastInsertRowid);
  }

  const innings = db.prepare('SELECT * FROM innings WHERE id = ?').get(result.lastInsertRowid);
  res.json(innings);
}

export function endMatch(req: Request, res: Response): void {
  const matchId = req.params.id;
  const { winner_id } = req.body;

  db.prepare('UPDATE matches SET status = ?, winner_id = ? WHERE id = ?')
    .run('completed', winner_id || null, matchId);
  db.prepare('UPDATE innings SET is_completed = 1 WHERE match_id = ? AND is_completed = 0')
    .run(matchId);

  const match = db.prepare(`
    SELECT m.*, t1.name as team1_name, t2.name as team2_name
    FROM matches m
    LEFT JOIN teams t1 ON m.team1_id = t1.id
    LEFT JOIN teams t2 ON m.team2_id = t2.id
    WHERE m.id = ?
  `).get(matchId);
  res.json(match);
}

export function getScorecard(req: Request, res: Response): void {
  const matchId = req.params.id;
  const match = db.prepare(`
    SELECT m.*, t1.name as team1_name, t2.name as team2_name,
           tw.name as toss_winner_name, w.name as winner_name
    FROM matches m
    LEFT JOIN teams t1 ON m.team1_id = t1.id
    LEFT JOIN teams t2 ON m.team2_id = t2.id
    LEFT JOIN teams tw ON m.toss_winner_id = tw.id
    LEFT JOIN teams w ON m.winner_id = w.id
    WHERE m.id = ?
  `).get(matchId);

  if (!match) {
    res.status(404).json({ error: 'Match not found' });
    return;
  }

  const inningsList = db.prepare('SELECT * FROM innings WHERE match_id = ? ORDER BY innings_number').all(matchId) as Record<string, number>[];

  const inningsData = inningsList.map((inn) => {
    const batting = db.prepare(`
      SELECT pms.*, p.name as player_name, p.role
      FROM player_match_stats pms
      JOIN players p ON pms.player_id = p.id
      WHERE pms.innings_id = ? AND pms.balls_faced > 0
      ORDER BY pms.id
    `).all(inn.id);

    const bowling = db.prepare(`
      SELECT pms.*, p.name as player_name, p.role
      FROM player_match_stats pms
      JOIN players p ON pms.player_id = p.id
      WHERE pms.innings_id = ? AND pms.overs_bowled > 0
      ORDER BY pms.id
    `).all(inn.id);

    const balls = db.prepare(`
      SELECT b.*, bp.name as batsman_name, bw.name as bowler_name,
             dp.name as dismissed_player_name, fp.name as fielder_name
      FROM balls b
      LEFT JOIN players bp ON b.batsman_id = bp.id
      LEFT JOIN players bw ON b.bowler_id = bw.id
      LEFT JOIN players dp ON b.dismissed_player_id = dp.id
      LEFT JOIN players fp ON b.fielder_id = fp.id
      WHERE b.innings_id = ?
      ORDER BY b.id
    `).all(inn.id);

    const battingTeam = db.prepare('SELECT name FROM teams WHERE id = ?').get(inn.batting_team_id) as { name: string };
    const bowlingTeam = db.prepare('SELECT name FROM teams WHERE id = ?').get(inn.bowling_team_id) as { name: string };

    return {
      ...inn,
      batting_team_name: battingTeam.name,
      bowling_team_name: bowlingTeam.name,
      batting,
      bowling,
      balls,
    };
  });

  res.json({ match, innings: inningsData });
}

export function getMatch(req: Request, res: Response): void {
  const match = db.prepare(`
    SELECT m.*, t1.name as team1_name, t2.name as team2_name
    FROM matches m
    LEFT JOIN teams t1 ON m.team1_id = t1.id
    LEFT JOIN teams t2 ON m.team2_id = t2.id
    WHERE m.id = ?
  `).get(req.params.id);
  if (!match) {
    res.status(404).json({ error: 'Match not found' });
    return;
  }
  const innings = db.prepare('SELECT * FROM innings WHERE match_id = ? ORDER BY innings_number').all(req.params.id);
  res.json({ ...match as object, innings });
}
