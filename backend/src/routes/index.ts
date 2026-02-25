import { Router } from 'express';
import { getAllTournaments, getTournament, createTournament, updateTournament } from '../controllers/tournaments';
import { getAllTeams, getTeam, createTeam, updateTeam } from '../controllers/teams';
import { getAllPlayers, getPlayer, createPlayer, getPlayerStats } from '../controllers/players';
import { getAllMatches, createMatch, startMatch, recordBall, getScorecard, getMatch, startSecondInnings, endMatch } from '../controllers/matches';

const router = Router();

// Tournament routes
router.get('/tournaments', getAllTournaments);
router.get('/tournaments/:id', getTournament);
router.post('/tournaments', createTournament);
router.put('/tournaments/:id', updateTournament);

// Team routes
router.get('/teams', getAllTeams);
router.get('/teams/:id', getTeam);
router.post('/teams', createTeam);
router.put('/teams/:id', updateTeam);

// Player routes
router.get('/players', getAllPlayers);
router.get('/players/:id', getPlayer);
router.post('/players', createPlayer);
router.get('/players/:id/stats', getPlayerStats);

// Match routes
router.get('/matches', getAllMatches);
router.get('/matches/:id', getMatch);
router.post('/matches', createMatch);
router.post('/matches/:id/start', startMatch);
router.post('/matches/:id/ball', recordBall);
router.post('/matches/:id/second-innings', startSecondInnings);
router.post('/matches/:id/end', endMatch);
router.get('/matches/:id/scorecard', getScorecard);

export default router;
