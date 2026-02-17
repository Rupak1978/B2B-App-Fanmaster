const express = require('express');
const router = express.Router();
const pool = require('../models/db');

// GET /api/tournaments
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tournaments ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/tournaments/:id
router.get('/:id', async (req, res) => {
  try {
    const tournament = await pool.query('SELECT * FROM tournaments WHERE id = $1', [req.params.id]);
    if (tournament.rows.length === 0) return res.status(404).json({ error: 'Not found' });

    // Get associated matches
    const matches = await pool.query(
      'SELECT * FROM matches WHERE tournament_id = $1 ORDER BY created_at',
      [req.params.id]
    );

    // Get teams
    const teamIds = JSON.parse(tournament.rows[0].teams_json || '[]');
    const teams = [];
    for (const tid of teamIds) {
      const t = await pool.query('SELECT * FROM teams WHERE id = $1', [tid]);
      if (t.rows.length > 0) teams.push(t.rows[0]);
    }

    res.json({
      ...tournament.rows[0],
      matches: matches.rows,
      teams,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/tournaments
router.post('/', async (req, res) => {
  try {
    const { id, name, default_rules_json, teams_json, status } = req.body;
    const result = await pool.query(
      `INSERT INTO tournaments (id, name, default_rules_json, teams_json, match_ids_json, status, created_at)
       VALUES ($1, $2, $3, $4, '[]', $5, NOW())
       RETURNING *`,
      [id, name, JSON.stringify(default_rules_json), JSON.stringify(teams_json), status || 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/tournaments/:id/standings
router.get('/:id/standings', async (req, res) => {
  try {
    const tournament = await pool.query('SELECT * FROM tournaments WHERE id = $1', [req.params.id]);
    if (tournament.rows.length === 0) return res.status(404).json({ error: 'Not found' });

    const matches = await pool.query(
      'SELECT * FROM matches WHERE tournament_id = $1 AND status = 2',
      [req.params.id]
    );

    const teamIds = JSON.parse(tournament.rows[0].teams_json || '[]');
    const rules = JSON.parse(tournament.rows[0].default_rules_json);
    const standings = {};

    // Initialize
    for (const tid of teamIds) {
      const team = await pool.query('SELECT name FROM teams WHERE id = $1', [tid]);
      standings[tid] = {
        team_id: tid,
        team_name: team.rows[0]?.name || 'Unknown',
        played: 0, won: 0, lost: 0, tied: 0, points: 0,
        runs_scored: 0, overs_faced: 0,
        runs_conceded: 0, overs_bowled: 0,
        nrr: 0,
      };
    }

    // Calculate from completed matches
    for (const match of matches.rows) {
      const innings = await pool.query(
        'SELECT * FROM innings WHERE match_id = $1 ORDER BY innings_number',
        [match.id]
      );

      for (const inn of innings.rows) {
        const balls = await pool.query(
          'SELECT * FROM ball_events WHERE innings_id = $1',
          [inn.id]
        );
        const totalRuns = balls.rows.reduce((s, b) => s + b.total_runs, 0);
        const legalBalls = balls.rows.filter(b => b.is_legal).length;
        const overs = legalBalls / 6;

        const batTeam = standings[inn.batting_team_id];
        const bowlTeam = standings[inn.bowling_team_id];
        if (batTeam) {
          batTeam.runs_scored += totalRuns;
          batTeam.overs_faced += overs;
        }
        if (bowlTeam) {
          bowlTeam.runs_conceded += totalRuns;
          bowlTeam.overs_bowled += overs;
        }
      }

      const s1 = standings[match.team1_id];
      const s2 = standings[match.team2_id];
      if (s1) s1.played++;
      if (s2) s2.played++;

      if (match.result === 0) { // team1 won
        if (s1) { s1.won++; s1.points += 2; }
        if (s2) { s2.lost++; }
      } else if (match.result === 1) { // team2 won
        if (s2) { s2.won++; s2.points += 2; }
        if (s1) { s1.lost++; }
      } else if (match.result === 2) { // tie
        if (s1) { s1.tied++; s1.points += 1; }
        if (s2) { s2.tied++; s2.points += 1; }
      }
    }

    // Calculate NRR
    const standingsArray = Object.values(standings).map(s => {
      if (s.overs_faced > 0 && s.overs_bowled > 0) {
        s.nrr = (s.runs_scored / s.overs_faced) - (s.runs_conceded / s.overs_bowled);
      }
      return s;
    });

    // Sort by points, then NRR
    standingsArray.sort((a, b) => b.points - a.points || b.nrr - a.nrr);

    res.json(standingsArray);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
