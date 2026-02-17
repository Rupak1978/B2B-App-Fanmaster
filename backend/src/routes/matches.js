const express = require('express');
const router = express.Router();
const pool = require('../models/db');

// GET /api/matches - List all matches
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT m.*,
        t1.name as team1_name, t1.short_name as team1_short,
        t2.name as team2_name, t2.short_name as team2_short
      FROM matches m
      JOIN teams t1 ON m.team1_id = t1.id
      JOIN teams t2 ON m.team2_id = t2.id
      ORDER BY m.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/matches/:id - Get match details
router.get('/:id', async (req, res) => {
  try {
    const matchResult = await pool.query('SELECT * FROM matches WHERE id = $1', [req.params.id]);
    if (matchResult.rows.length === 0) {
      return res.status(404).json({ error: 'Match not found' });
    }

    const match = matchResult.rows[0];

    // Get innings
    const inningsResult = await pool.query(
      'SELECT * FROM innings WHERE match_id = $1 ORDER BY innings_number',
      [req.params.id]
    );

    // Get ball events
    const ballsResult = await pool.query(
      'SELECT * FROM ball_events WHERE match_id = $1 ORDER BY timestamp',
      [req.params.id]
    );

    // Get teams
    const team1 = await pool.query('SELECT * FROM teams WHERE id = $1', [match.team1_id]);
    const team2 = await pool.query('SELECT * FROM teams WHERE id = $1', [match.team2_id]);

    // Get players
    const players = await pool.query(
      'SELECT * FROM players WHERE team_id IN ($1, $2)',
      [match.team1_id, match.team2_id]
    );

    res.json({
      ...match,
      team1: { ...team1.rows[0], players: players.rows.filter(p => p.team_id === match.team1_id) },
      team2: { ...team2.rows[0], players: players.rows.filter(p => p.team_id === match.team2_id) },
      innings: inningsResult.rows,
      ballEvents: ballsResult.rows,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/matches - Create match
router.post('/', async (req, res) => {
  try {
    const { id, tournament_id, team1_id, team2_id, rules_json, status } = req.body;
    const result = await pool.query(
      `INSERT INTO matches (id, tournament_id, team1_id, team2_id, rules_json, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING *`,
      [id, tournament_id, team1_id, team2_id, JSON.stringify(rules_json), status || 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/matches/:id/status - Update match status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status, result: matchResult, result_description } = req.body;
    const updates = ['status = $2'];
    const values = [req.params.id, status];
    let idx = 3;

    if (matchResult !== undefined) {
      updates.push(`result = $${idx}`);
      values.push(matchResult);
      idx++;
    }
    if (result_description) {
      updates.push(`result_description = $${idx}`);
      values.push(result_description);
      idx++;
    }
    if (status === 1) {
      updates.push(`started_at = NOW()`);
    }
    if (status === 2) {
      updates.push(`completed_at = NOW()`);
    }

    const queryResult = await pool.query(
      `UPDATE matches SET ${updates.join(', ')} WHERE id = $1 RETURNING *`,
      values
    );
    res.json(queryResult.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/matches/:id/live - Get live score snapshot
router.get('/:id/live', async (req, res) => {
  try {
    const match = await pool.query('SELECT * FROM matches WHERE id = $1', [req.params.id]);
    if (match.rows.length === 0) return res.status(404).json({ error: 'Not found' });

    const innings = await pool.query(
      'SELECT * FROM innings WHERE match_id = $1 ORDER BY innings_number',
      [req.params.id]
    );

    const currentInnings = innings.rows.find(i => i.status === 1) || innings.rows[innings.rows.length - 1];
    if (!currentInnings) return res.json({ match: match.rows[0], innings: null });

    const balls = await pool.query(
      'SELECT * FROM ball_events WHERE innings_id = $1 ORDER BY timestamp',
      [currentInnings.id]
    );

    const legalBalls = balls.rows.filter(b => b.is_legal);
    const totalRuns = balls.rows.reduce((sum, b) => sum + b.total_runs, 0);
    const wickets = balls.rows.filter(b => b.is_wicket && b.wicket_type !== 6).length;
    const overs = Math.floor(legalBalls.length / 6);
    const ballsInOver = legalBalls.length % 6;

    res.json({
      match: match.rows[0],
      innings: currentInnings,
      score: {
        totalRuns,
        wickets,
        overs: `${overs}.${ballsInOver}`,
        currentRunRate: legalBalls.length > 0 ? ((totalRuns / legalBalls.length) * 6).toFixed(2) : '0.00',
        target: currentInnings.target,
      },
      recentBalls: balls.rows.slice(-12),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
