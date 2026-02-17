const express = require('express');
const router = express.Router();
const pool = require('../models/db');
const { broadcastToMatch } = require('../websocket/ws');

// POST /api/ball-events - Record a ball event
router.post('/', async (req, res) => {
  try {
    const b = req.body;
    const result = await pool.query(
      `INSERT INTO ball_events (
        id, match_id, innings_id, over_number, ball_number, legal_ball_number,
        is_legal, striker_id, non_striker_id, bowler_id,
        runs_off_bat, extra_runs, extra_type, total_runs,
        boundary_type, is_wicket, wicket_type, fielder_name, dismissed_player_id,
        is_power_ball, power_ball_multiplier,
        power_ball_wicket_deduction_applied, power_ball_deduction_amount,
        timestamp
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24)
      RETURNING *`,
      [
        b.id, b.match_id, b.innings_id, b.over_number, b.ball_number,
        b.legal_ball_number, b.is_legal, b.striker_id, b.non_striker_id,
        b.bowler_id, b.runs_off_bat, b.extra_runs, b.extra_type,
        b.total_runs, b.boundary_type, b.is_wicket, b.wicket_type,
        b.fielder_name, b.dismissed_player_id, b.is_power_ball,
        b.power_ball_multiplier, b.power_ball_wicket_deduction_applied,
        b.power_ball_deduction_amount, b.timestamp,
      ]
    );

    // Broadcast to audience via WebSocket
    broadcastToMatch(b.match_id, {
      type: 'ball_event',
      data: result.rows[0],
    });

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/ball-events/innings/:inningsId
router.get('/innings/:inningsId', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM ball_events WHERE innings_id = $1 ORDER BY timestamp',
      [req.params.inningsId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/ball-events/:id - Undo (delete last ball)
router.delete('/:id', async (req, res) => {
  try {
    const ball = await pool.query('SELECT * FROM ball_events WHERE id = $1', [req.params.id]);
    if (ball.rows.length === 0) return res.status(404).json({ error: 'Not found' });

    await pool.query('DELETE FROM ball_events WHERE id = $1', [req.params.id]);

    // Broadcast undo
    broadcastToMatch(ball.rows[0].match_id, {
      type: 'undo',
      data: { ballEventId: req.params.id },
    });

    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
