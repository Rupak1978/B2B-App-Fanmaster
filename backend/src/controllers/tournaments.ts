import { Request, Response } from 'express';
import db from '../db/schema';

export function getAllTournaments(_req: Request, res: Response): void {
  const tournaments = db.prepare('SELECT * FROM tournaments ORDER BY created_at DESC').all();
  res.json(tournaments);
}

export function getTournament(req: Request, res: Response): void {
  const tournament = db.prepare('SELECT * FROM tournaments WHERE id = ?').get(req.params.id);
  if (!tournament) {
    res.status(404).json({ error: 'Tournament not found' });
    return;
  }
  const teams = db.prepare('SELECT * FROM teams WHERE tournament_id = ?').all(req.params.id);
  const matches = db.prepare(`
    SELECT m.*, t1.name as team1_name, t2.name as team2_name,
           tw.name as toss_winner_name, w.name as winner_name
    FROM matches m
    LEFT JOIN teams t1 ON m.team1_id = t1.id
    LEFT JOIN teams t2 ON m.team2_id = t2.id
    LEFT JOIN teams tw ON m.toss_winner_id = tw.id
    LEFT JOIN teams w ON m.winner_id = w.id
    WHERE m.tournament_id = ?
    ORDER BY m.match_date
  `).all(req.params.id);
  res.json({ ...tournament as object, teams, matches });
}

export function createTournament(req: Request, res: Response): void {
  const { name, format, tournament_type, start_date, venue, num_teams } = req.body;
  if (!name || !format || !tournament_type) {
    res.status(400).json({ error: 'name, format, and tournament_type are required' });
    return;
  }
  const result = db.prepare(
    'INSERT INTO tournaments (name, format, tournament_type, start_date, venue, num_teams) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(name, format, tournament_type, start_date || null, venue || null, num_teams || 2);
  const tournament = db.prepare('SELECT * FROM tournaments WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(tournament);
}

export function updateTournament(req: Request, res: Response): void {
  const { name, format, tournament_type, start_date, venue, num_teams, status } = req.body;
  const existing = db.prepare('SELECT * FROM tournaments WHERE id = ?').get(req.params.id);
  if (!existing) {
    res.status(404).json({ error: 'Tournament not found' });
    return;
  }
  db.prepare(
    `UPDATE tournaments SET name = COALESCE(?, name), format = COALESCE(?, format),
     tournament_type = COALESCE(?, tournament_type), start_date = COALESCE(?, start_date),
     venue = COALESCE(?, venue), num_teams = COALESCE(?, num_teams), status = COALESCE(?, status)
     WHERE id = ?`
  ).run(name, format, tournament_type, start_date, venue, num_teams, status, req.params.id);
  const tournament = db.prepare('SELECT * FROM tournaments WHERE id = ?').get(req.params.id);
  res.json(tournament);
}
