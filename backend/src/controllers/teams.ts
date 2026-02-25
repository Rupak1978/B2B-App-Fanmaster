import { Request, Response } from 'express';
import db from '../db/schema';

export function getAllTeams(req: Request, res: Response): void {
  const { tournament_id } = req.query;
  let teams;
  if (tournament_id) {
    teams = db.prepare('SELECT * FROM teams WHERE tournament_id = ? ORDER BY name').all(tournament_id);
  } else {
    teams = db.prepare('SELECT * FROM teams ORDER BY name').all();
  }
  res.json(teams);
}

export function getTeam(req: Request, res: Response): void {
  const team = db.prepare('SELECT * FROM teams WHERE id = ?').get(req.params.id);
  if (!team) {
    res.status(404).json({ error: 'Team not found' });
    return;
  }
  const players = db.prepare('SELECT * FROM players WHERE team_id = ? ORDER BY name').all(req.params.id);
  res.json({ ...team as object, players });
}

export function createTeam(req: Request, res: Response): void {
  const { name, tournament_id } = req.body;
  if (!name) {
    res.status(400).json({ error: 'name is required' });
    return;
  }
  const result = db.prepare(
    'INSERT INTO teams (name, tournament_id) VALUES (?, ?)'
  ).run(name, tournament_id || null);
  const team = db.prepare('SELECT * FROM teams WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(team);
}

export function updateTeam(req: Request, res: Response): void {
  const { name, tournament_id } = req.body;
  const existing = db.prepare('SELECT * FROM teams WHERE id = ?').get(req.params.id);
  if (!existing) {
    res.status(404).json({ error: 'Team not found' });
    return;
  }
  db.prepare(
    'UPDATE teams SET name = COALESCE(?, name), tournament_id = COALESCE(?, tournament_id) WHERE id = ?'
  ).run(name, tournament_id, req.params.id);
  const team = db.prepare('SELECT * FROM teams WHERE id = ?').get(req.params.id);
  res.json(team);
}
