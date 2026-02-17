const express = require('express');
const router = express.Router();
const pool = require('../models/db');

// GET /api/teams
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM teams ORDER BY name');
    const teams = [];
    for (const team of result.rows) {
      const players = await pool.query(
        'SELECT * FROM players WHERE team_id = $1 ORDER BY name',
        [team.id]
      );
      teams.push({ ...team, players: players.rows });
    }
    res.json(teams);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/teams
router.post('/', async (req, res) => {
  try {
    const { id, name, short_name, players } = req.body;
    const teamResult = await pool.query(
      'INSERT INTO teams (id, name, short_name) VALUES ($1, $2, $3) RETURNING *',
      [id, name, short_name]
    );

    if (players && players.length > 0) {
      for (const player of players) {
        await pool.query(
          'INSERT INTO players (id, name, team_id) VALUES ($1, $2, $3)',
          [player.id, player.name, id]
        );
      }
    }

    res.status(201).json(teamResult.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/teams/:id
router.get('/:id', async (req, res) => {
  try {
    const team = await pool.query('SELECT * FROM teams WHERE id = $1', [req.params.id]);
    if (team.rows.length === 0) return res.status(404).json({ error: 'Not found' });

    const players = await pool.query(
      'SELECT * FROM players WHERE team_id = $1',
      [req.params.id]
    );

    res.json({ ...team.rows[0], players: players.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
