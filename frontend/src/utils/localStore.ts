// localStorage-based storage layer with user-scoped data.
// All data is keyed by user mobile number for multi-user support.

import { DEFAULT_RULES } from '../types';

let currentUserId = '';

export function setCurrentUser(userId: string) {
  currentUserId = userId;
}

export function getCurrentUser(): string {
  return currentUserId;
}

function prefix(): string {
  return currentUserId ? `cl_${currentUserId}_` : 'cl_';
}

function getStore<T>(key: string): T[] {
  try {
    return JSON.parse(localStorage.getItem(`${prefix()}${key}`) || '[]');
  } catch {
    return [];
  }
}

function setStore<T>(key: string, data: T[]) {
  localStorage.setItem(`${prefix()}${key}`, JSON.stringify(data));
}

function nextId(key: string): number {
  const k = `${prefix()}id_${key}`;
  const id = (parseInt(localStorage.getItem(k) || '0', 10) || 0) + 1;
  localStorage.setItem(k, String(id));
  return id;
}

function now() {
  return new Date().toISOString();
}

// --- Tournaments ---

function getTournaments(): any[] {
  return getStore('tournaments');
}

function getTournament(id: number): any {
  const t = getStore<any>('tournaments').find((t: any) => t.id === id);
  if (!t) throw new Error('Tournament not found');
  const teams = getStore<any>('teams').filter((tm: any) => tm.tournament_id === id);
  const matches = getStore<any>('matches').filter((m: any) => m.tournament_id === id).map(enrichMatch);
  return { ...t, teams, matches };
}

function createTournament(data: any): any {
  const tournaments = getStore<any>('tournaments');
  const t = {
    id: nextId('tournaments'),
    user_id: currentUserId,
    name: data.name,
    format: data.format || 'Custom',
    tournament_type: data.tournament_type || 'League',
    start_date: data.start_date || null,
    venue: data.venue || null,
    num_teams: data.num_teams || 2,
    status: 'upcoming',
    created_at: now(),
  };
  tournaments.push(t);
  setStore('tournaments', tournaments);
  return t;
}

// --- Teams ---

function getTeams(tournamentId?: number): any[] {
  const teams = getStore<any>('teams');
  if (tournamentId) return teams.filter((t: any) => t.tournament_id === tournamentId);
  return teams;
}

function getTeam(id: number): any {
  const t = getStore<any>('teams').find((t: any) => t.id === id);
  if (!t) throw new Error('Team not found');
  const players = getStore<any>('players').filter((p: any) => p.team_id === id);
  return { ...t, players };
}

function createTeam(data: any): any {
  const teams = getStore<any>('teams');
  const t = {
    id: nextId('teams'),
    user_id: currentUserId,
    name: data.name,
    tournament_id: data.tournament_id || null,
    created_at: now(),
  };
  teams.push(t);
  setStore('teams', teams);
  return t;
}

// --- Players ---

function getPlayers(teamId?: number): any[] {
  const players = getStore<any>('players');
  const teams = getStore<any>('teams');
  const result = teamId ? players.filter((p: any) => p.team_id === teamId) : players;
  return result.map((p: any) => {
    const team = teams.find((t: any) => t.id === p.team_id);
    return { ...p, team_name: team?.name || null };
  });
}

function getPlayer(id: number): any {
  const p = getStore<any>('players').find((p: any) => p.id === id);
  if (!p) throw new Error('Player not found');
  return p;
}

function createPlayer(data: any): any {
  const players = getStore<any>('players');
  const p = {
    id: nextId('players'),
    user_id: currentUserId,
    name: data.name,
    team_id: data.team_id || null,
    role: data.role || 'batsman',
    created_at: now(),
  };
  players.push(p);
  setStore('players', players);
  return p;
}

function getPlayerStats(id: number): any {
  const player = getPlayer(id);
  const teams = getStore<any>('teams');
  const team = teams.find((t: any) => t.id === player.team_id);
  const stats = getStore<any>('player_match_stats').filter((s: any) => s.player_id === id);

  let totalRuns = 0, totalBalls = 0, totalFours = 0, totalSixes = 0, highestScore = 0;
  let totalOvers = 0, totalRunsConceded = 0, totalWickets = 0, totalMaidens = 0;
  let bestWickets = 0, bestFiguresRuns = 999;
  const matchIds = new Set<number>();

  for (const s of stats) {
    matchIds.add(s.match_id);
    totalRuns += s.runs_scored || 0;
    totalBalls += s.balls_faced || 0;
    totalFours += s.fours || 0;
    totalSixes += s.sixes || 0;
    if ((s.runs_scored || 0) > highestScore) highestScore = s.runs_scored;
    totalOvers += s.overs_bowled || 0;
    totalRunsConceded += s.runs_conceded || 0;
    totalWickets += s.wickets_taken || 0;
    totalMaidens += s.maidens || 0;
    if ((s.wickets_taken || 0) > bestWickets || ((s.wickets_taken || 0) === bestWickets && (s.runs_conceded || 0) < bestFiguresRuns)) {
      bestWickets = s.wickets_taken || 0;
      bestFiguresRuns = s.runs_conceded || 0;
    }
  }

  if (bestFiguresRuns === 999) bestFiguresRuns = 0;
  const matches = matchIds.size;
  const average = matches > 0 ? (totalRuns / Math.max(matches, 1)).toFixed(2) : '0.00';
  const strikeRate = totalBalls > 0 ? ((totalRuns / totalBalls) * 100).toFixed(2) : '0.00';
  const economy = totalOvers > 0 ? (totalRunsConceded / totalOvers).toFixed(2) : '0.00';
  const bowlAvg = totalWickets > 0 ? (totalRunsConceded / totalWickets).toFixed(2) : '0.00';

  return {
    ...player,
    team_name: team?.name || null,
    batting: {
      matches, runs: totalRuns, balls_faced: totalBalls, fours: totalFours, sixes: totalSixes,
      highest_score: highestScore, average, strike_rate: strikeRate,
    },
    bowling: {
      overs: totalOvers, runs_conceded: totalRunsConceded, wickets: totalWickets, maidens: totalMaidens,
      economy, average: bowlAvg, best_wickets: bestWickets, best_figures_runs: bestFiguresRuns,
      five_wicket_hauls: stats.filter((s: any) => (s.wickets_taken || 0) >= 5).length,
    },
    match_history: stats,
  };
}

// --- Matches ---

function enrichMatch(m: any): any {
  const teams = getStore<any>('teams');
  const t1 = teams.find((t: any) => t.id === m.team1_id);
  const t2 = teams.find((t: any) => t.id === m.team2_id);
  const winner = m.winner_id ? teams.find((t: any) => t.id === m.winner_id) : null;
  return {
    ...m,
    team1_name: t1?.name || 'Team 1',
    team2_name: t2?.name || 'Team 2',
    winner_name: winner?.name || null,
  };
}

function getMatches(): any[] {
  return getStore<any>('matches').map(enrichMatch);
}

function getMatch(id: number): any {
  const m = getStore<any>('matches').find((m: any) => m.id === id);
  if (!m) throw new Error('Match not found');
  return enrichMatch(m);
}

function createMatch(data: any): any {
  const matches = getStore<any>('matches');
  const rules = data.rules || DEFAULT_RULES;
  const m = {
    id: nextId('matches'),
    user_id: currentUserId,
    tournament_id: data.tournament_id || null,
    team1_id: data.team1_id,
    team2_id: data.team2_id,
    overs: rules.overs || data.overs || 10,
    rules,
    venue: data.venue || null,
    toss_winner_id: data.toss_winner_id || null,
    toss_decision: data.toss_decision || null,
    status: 'upcoming',
    winner_id: null,
    match_date: data.match_date || now(),
    created_at: now(),
  };
  matches.push(m);
  setStore('matches', matches);
  return m;
}

function startMatch(id: number, data: any): any {
  const matches = getStore<any>('matches');
  const idx = matches.findIndex((m: any) => m.id === id);
  if (idx === -1) throw new Error('Match not found');

  matches[idx].status = 'in_progress';
  setStore('matches', matches);

  const innings = getStore<any>('innings');
  const match = matches[idx];
  const bowlingTeamId = data.batting_team_id === match.team1_id ? match.team2_id : match.team1_id;
  const inn = {
    id: nextId('innings'),
    match_id: id,
    batting_team_id: data.batting_team_id,
    bowling_team_id: bowlingTeamId,
    innings_number: 1,
    total_runs: 0,
    total_wickets: 0,
    total_overs: 0,
    extras: 0,
    extras_wide: 0,
    extras_noball: 0,
    extras_bye: 0,
    extras_legbye: 0,
    is_completed: 0,
    created_at: now(),
  };
  innings.push(inn);
  setStore('innings', innings);

  initPlayerStats(id, inn.id, data.batting_team_id, bowlingTeamId);
  return matches[idx];
}

function initPlayerStats(matchId: number, inningsId: number, battingTeamId: number, bowlingTeamId: number) {
  const allPlayers = getStore<any>('players');
  const pms = getStore<any>('player_match_stats');
  const batPlayers = allPlayers.filter((p: any) => p.team_id === battingTeamId);
  const bowlPlayers = allPlayers.filter((p: any) => p.team_id === bowlingTeamId);

  for (const p of [...batPlayers, ...bowlPlayers]) {
    if (!pms.find((s: any) => s.player_id === p.id && s.innings_id === inningsId)) {
      pms.push({
        id: nextId('player_match_stats'),
        player_id: p.id,
        player_name: p.name,
        role: p.role,
        match_id: matchId,
        innings_id: inningsId,
        runs_scored: 0,
        balls_faced: 0,
        fours: 0,
        sixes: 0,
        overs_bowled: 0,
        runs_conceded: 0,
        wickets_taken: 0,
        maidens: 0,
        catches: 0,
        run_outs: 0,
        stumpings: 0,
        dismissal_type: null,
        dismissal_info: null,
        created_at: now(),
      });
    }
  }
  setStore('player_match_stats', pms);
}

function getBallsPerOver(matchId: number): number {
  const match = getStore<any>('matches').find((m: any) => m.id === matchId);
  return match?.rules?.balls_per_over || 6;
}

function recordBall(matchId: number, data: any): any {
  const balls = getStore<any>('balls');
  const innings = getStore<any>('innings');
  const innIdx = innings.findIndex((i: any) => i.id === data.innings_id);
  if (innIdx === -1) throw new Error('Innings not found');

  const inn = innings[innIdx];
  const bpo = getBallsPerOver(matchId);

  const inningsBalls = balls.filter((b: any) => b.innings_id === data.innings_id);
  const legalBalls = inningsBalls.filter((b: any) => !b.is_extra || (b.extra_type !== 'wide' && b.extra_type !== 'no-ball'));
  const overNumber = Math.floor(legalBalls.length / bpo) + 1;
  const ballNumber = (legalBalls.length % bpo) + 1;

  const allPlayers = getStore<any>('players');
  const batsman = allPlayers.find((p: any) => p.id === data.batsman_id);
  const bowlerPlayer = allPlayers.find((p: any) => p.id === data.bowler_id);

  const ball: any = {
    id: nextId('balls'),
    innings_id: data.innings_id,
    over_number: overNumber,
    ball_number: ballNumber,
    batsman_id: data.batsman_id,
    batsman_name: batsman?.name || '',
    bowler_id: data.bowler_id,
    bowler_name: bowlerPlayer?.name || '',
    runs: data.runs || 0,
    is_extra: data.is_extra || 0,
    extra_type: data.extra_type || null,
    extra_runs: data.extra_runs || 0,
    is_wicket: data.is_wicket || 0,
    wicket_type: data.wicket_type || null,
    dismissed_player_id: data.dismissed_player_id || null,
    dismissed_player_name: data.dismissed_player_id ? allPlayers.find((p: any) => p.id === data.dismissed_player_id)?.name : null,
    fielder_id: data.fielder_id || null,
    fielder_name: data.fielder_id ? allPlayers.find((p: any) => p.id === data.fielder_id)?.name : null,
    is_free_hit: data.is_free_hit || 0,
    created_at: now(),
  };
  balls.push(ball);
  setStore('balls', balls);

  // Update innings totals
  const totalRuns = (data.runs || 0) + (data.extra_runs || 0);
  inn.total_runs += totalRuns;
  inn.extras += data.extra_runs || 0;
  if (data.extra_type === 'wide') inn.extras_wide = (inn.extras_wide || 0) + (data.extra_runs || 0);
  if (data.extra_type === 'no-ball') inn.extras_noball = (inn.extras_noball || 0) + (data.extra_runs || 0);
  if (data.extra_type === 'bye') inn.extras_bye = (inn.extras_bye || 0) + (data.extra_runs || 0);
  if (data.extra_type === 'leg-bye') inn.extras_legbye = (inn.extras_legbye || 0) + (data.extra_runs || 0);
  if (data.is_wicket) inn.total_wickets += 1;

  const isLegal = !data.is_extra || (data.extra_type !== 'wide' && data.extra_type !== 'no-ball');
  if (isLegal) {
    const newLegalBalls = legalBalls.length + 1;
    inn.total_overs = parseFloat((Math.floor(newLegalBalls / bpo) + (newLegalBalls % bpo) / 10).toFixed(1));
  }

  // Check if innings complete
  const matches = getStore<any>('matches');
  const match = matches.find((m: any) => m.id === matchId);
  const maxOvers = match?.overs || 10;
  const rules = match?.rules || DEFAULT_RULES;
  const allPlayersInTeam = getStore<any>('players').filter((p: any) => p.team_id === inn.batting_team_id);
  const wicketLimit = rules.last_man_stands ? allPlayersInTeam.length : allPlayersInTeam.length - 1;
  if (inn.total_wickets >= wicketLimit || (isLegal && legalBalls.length + 1 >= maxOvers * bpo)) {
    inn.is_completed = 1;
  }

  // Check 2nd innings chase target
  if (inn.innings_number === 2) {
    const firstInnings = innings.find((i: any) => i.match_id === matchId && i.innings_number === 1);
    if (firstInnings && inn.total_runs > firstInnings.total_runs) {
      inn.is_completed = 1;
    }
  }

  innings[innIdx] = inn;
  setStore('innings', innings);

  // Update player_match_stats
  const pms = getStore<any>('player_match_stats');

  const batIdx = pms.findIndex((s: any) => s.player_id === data.batsman_id && s.innings_id === data.innings_id);
  if (batIdx !== -1) {
    pms[batIdx].runs_scored += data.runs || 0;
    if (isLegal) pms[batIdx].balls_faced += 1;
    if (data.runs === 4) pms[batIdx].fours += 1;
    if (data.runs === 6) pms[batIdx].sixes += 1;
    if (data.is_wicket && (data.dismissed_player_id === data.batsman_id || !data.dismissed_player_id)) {
      pms[batIdx].dismissal_type = data.wicket_type;
      pms[batIdx].dismissal_info = buildDismissalInfo(data, allPlayers);
    }
  }

  // If a different player was dismissed (run out)
  if (data.is_wicket && data.dismissed_player_id && data.dismissed_player_id !== data.batsman_id) {
    const dIdx = pms.findIndex((s: any) => s.player_id === data.dismissed_player_id && s.innings_id === data.innings_id);
    if (dIdx !== -1) {
      pms[dIdx].dismissal_type = data.wicket_type;
      pms[dIdx].dismissal_info = buildDismissalInfo(data, allPlayers);
    }
  }

  const bowlIdx = pms.findIndex((s: any) => s.player_id === data.bowler_id && s.innings_id === data.innings_id);
  if (bowlIdx !== -1) {
    pms[bowlIdx].runs_conceded += totalRuns;
    if (isLegal) {
      const bowlerBalls = balls.filter((b: any) =>
        b.innings_id === data.innings_id && b.bowler_id === data.bowler_id &&
        (!b.is_extra || (b.extra_type !== 'wide' && b.extra_type !== 'no-ball'))
      );
      pms[bowlIdx].overs_bowled = parseFloat((Math.floor(bowlerBalls.length / bpo) + (bowlerBalls.length % bpo) / 10).toFixed(1));
    }
    if (data.is_wicket && data.wicket_type !== 'run_out') {
      pms[bowlIdx].wickets_taken += 1;
    }
  }

  setStore('player_match_stats', pms);
  return ball;
}

function buildDismissalInfo(data: any, allPlayers: any[]): string {
  const bowler = allPlayers.find((p: any) => p.id === data.bowler_id);
  const fielder = data.fielder_id ? allPlayers.find((p: any) => p.id === data.fielder_id) : null;
  switch (data.wicket_type) {
    case 'bowled': return `b ${bowler?.name || ''}`;
    case 'caught': return fielder ? `c ${fielder.name} b ${bowler?.name || ''}` : `c & b ${bowler?.name || ''}`;
    case 'lbw': return `lbw b ${bowler?.name || ''}`;
    case 'run_out': return fielder ? `run out (${fielder.name})` : 'run out';
    case 'stumped': return fielder ? `st ${fielder.name} b ${bowler?.name || ''}` : `st b ${bowler?.name || ''}`;
    case 'hit_wicket': return `hit wicket b ${bowler?.name || ''}`;
    case 'retired': return 'retired';
    default: return '';
  }
}

function undoLastBall(matchId: number): any {
  const balls = getStore<any>('balls');
  const innings = getStore<any>('innings');
  const matchInnings = innings.filter((i: any) => i.match_id === matchId);
  if (matchInnings.length === 0) return null;

  const currentInn = matchInnings[matchInnings.length - 1];
  const inningsBalls = balls.filter((b: any) => b.innings_id === currentInn.id);
  if (inningsBalls.length === 0) return null;

  const lastBall = inningsBalls[inningsBalls.length - 1];
  const bpo = getBallsPerOver(matchId);

  // Remove ball
  const ballIdx = balls.findIndex((b: any) => b.id === lastBall.id);
  if (ballIdx !== -1) balls.splice(ballIdx, 1);
  setStore('balls', balls);

  // Reverse innings totals
  const innIdx = innings.findIndex((i: any) => i.id === currentInn.id);
  const inn = innings[innIdx];
  const totalRuns = (lastBall.runs || 0) + (lastBall.extra_runs || 0);
  inn.total_runs -= totalRuns;
  inn.extras -= lastBall.extra_runs || 0;
  if (lastBall.extra_type === 'wide') inn.extras_wide = Math.max(0, (inn.extras_wide || 0) - (lastBall.extra_runs || 0));
  if (lastBall.extra_type === 'no-ball') inn.extras_noball = Math.max(0, (inn.extras_noball || 0) - (lastBall.extra_runs || 0));
  if (lastBall.extra_type === 'bye') inn.extras_bye = Math.max(0, (inn.extras_bye || 0) - (lastBall.extra_runs || 0));
  if (lastBall.extra_type === 'leg-bye') inn.extras_legbye = Math.max(0, (inn.extras_legbye || 0) - (lastBall.extra_runs || 0));
  if (lastBall.is_wicket) inn.total_wickets -= 1;
  inn.is_completed = 0;

  const isLegal = !lastBall.is_extra || (lastBall.extra_type !== 'wide' && lastBall.extra_type !== 'no-ball');
  if (isLegal) {
    const remainingLegal = balls.filter((b: any) =>
      b.innings_id === currentInn.id && (!b.is_extra || (b.extra_type !== 'wide' && b.extra_type !== 'no-ball'))
    );
    inn.total_overs = parseFloat((Math.floor(remainingLegal.length / bpo) + (remainingLegal.length % bpo) / 10).toFixed(1));
  }

  innings[innIdx] = inn;
  setStore('innings', innings);

  // Reverse player stats
  const pms = getStore<any>('player_match_stats');
  const batIdx = pms.findIndex((s: any) => s.player_id === lastBall.batsman_id && s.innings_id === lastBall.innings_id);
  if (batIdx !== -1) {
    pms[batIdx].runs_scored -= lastBall.runs || 0;
    if (isLegal) pms[batIdx].balls_faced -= 1;
    if (lastBall.runs === 4) pms[batIdx].fours -= 1;
    if (lastBall.runs === 6) pms[batIdx].sixes -= 1;
    if (lastBall.is_wicket && (lastBall.dismissed_player_id === lastBall.batsman_id || !lastBall.dismissed_player_id)) {
      pms[batIdx].dismissal_type = null;
      pms[batIdx].dismissal_info = null;
    }
  }

  if (lastBall.is_wicket && lastBall.dismissed_player_id && lastBall.dismissed_player_id !== lastBall.batsman_id) {
    const dIdx = pms.findIndex((s: any) => s.player_id === lastBall.dismissed_player_id && s.innings_id === lastBall.innings_id);
    if (dIdx !== -1) {
      pms[dIdx].dismissal_type = null;
      pms[dIdx].dismissal_info = null;
    }
  }

  const bowlIdx = pms.findIndex((s: any) => s.player_id === lastBall.bowler_id && s.innings_id === lastBall.innings_id);
  if (bowlIdx !== -1) {
    pms[bowlIdx].runs_conceded -= totalRuns;
    if (isLegal) {
      const bowlerBalls = balls.filter((b: any) =>
        b.innings_id === lastBall.innings_id && b.bowler_id === lastBall.bowler_id &&
        (!b.is_extra || (b.extra_type !== 'wide' && b.extra_type !== 'no-ball'))
      );
      pms[bowlIdx].overs_bowled = parseFloat((Math.floor(bowlerBalls.length / bpo) + (bowlerBalls.length % bpo) / 10).toFixed(1));
    }
    if (lastBall.is_wicket && lastBall.wicket_type !== 'run_out') {
      pms[bowlIdx].wickets_taken -= 1;
    }
  }

  setStore('player_match_stats', pms);
  return lastBall;
}

function startSecondInnings(matchId: number): any {
  const innings = getStore<any>('innings');
  const matches = getStore<any>('matches');
  const match = matches.find((m: any) => m.id === matchId);
  if (!match) throw new Error('Match not found');

  const firstInnings = innings.find((i: any) => i.match_id === matchId && i.innings_number === 1);
  if (!firstInnings) throw new Error('First innings not found');

  const firstIdx = innings.findIndex((i: any) => i.id === firstInnings.id);
  if (firstIdx !== -1) innings[firstIdx].is_completed = 1;

  const inn = {
    id: nextId('innings'),
    match_id: matchId,
    batting_team_id: firstInnings.bowling_team_id,
    bowling_team_id: firstInnings.batting_team_id,
    innings_number: 2,
    total_runs: 0,
    total_wickets: 0,
    total_overs: 0,
    extras: 0,
    extras_wide: 0,
    extras_noball: 0,
    extras_bye: 0,
    extras_legbye: 0,
    is_completed: 0,
    created_at: now(),
  };
  innings.push(inn);
  setStore('innings', innings);

  initPlayerStats(matchId, inn.id, inn.batting_team_id, inn.bowling_team_id);
  return inn;
}

function endMatch(matchId: number, data: any): any {
  const matches = getStore<any>('matches');
  const idx = matches.findIndex((m: any) => m.id === matchId);
  if (idx === -1) throw new Error('Match not found');

  matches[idx].status = 'completed';
  matches[idx].winner_id = data.winner_id || null;

  const innings = getStore<any>('innings');
  for (let i = 0; i < innings.length; i++) {
    if (innings[i].match_id === matchId) innings[i].is_completed = 1;
  }
  setStore('innings', innings);
  setStore('matches', matches);
  return matches[idx];
}

function getScorecard(matchId: number): any {
  const match = getMatch(matchId);
  const allInnings = getStore<any>('innings').filter((i: any) => i.match_id === matchId);
  const allBalls = getStore<any>('balls');
  const allPms = getStore<any>('player_match_stats');
  const teams = getStore<any>('teams');
  const allPlayers = getStore<any>('players');

  const inningsData = allInnings.map((inn: any) => {
    const battingTeam = teams.find((t: any) => t.id === inn.batting_team_id);
    const bowlingTeam = teams.find((t: any) => t.id === inn.bowling_team_id);
    const balls = allBalls.filter((b: any) => b.innings_id === inn.id);
    const batting = allPms.filter((s: any) => s.innings_id === inn.id && allPlayers.find((p: any) => p.id === s.player_id && p.team_id === inn.batting_team_id));
    const bowling = allPms.filter((s: any) => s.innings_id === inn.id && allPlayers.find((p: any) => p.id === s.player_id && p.team_id === inn.bowling_team_id));

    // Build fall of wickets
    const wicketBalls = balls.filter((b: any) => b.is_wicket);
    const bpo = match.rules?.balls_per_over || 6;
    const fall_of_wickets = wicketBalls.map((b: any, i: number) => {
      const ballsUpTo = balls.filter((bb: any) => bb.id <= b.id);
      const runsAtWicket = ballsUpTo.reduce((sum: number, bb: any) => sum + (bb.runs || 0) + (bb.extra_runs || 0), 0);
      const legalBallsUpTo = ballsUpTo.filter((bb: any) => !bb.is_extra || (bb.extra_type !== 'wide' && bb.extra_type !== 'no-ball'));
      const overs = parseFloat((Math.floor(legalBallsUpTo.length / bpo) + (legalBallsUpTo.length % bpo) / 10).toFixed(1));
      return {
        wicket_number: i + 1,
        runs: runsAtWicket,
        overs,
        player_name: b.dismissed_player_name || b.batsman_name || '',
        player_id: b.dismissed_player_id || b.batsman_id,
      };
    });

    return {
      ...inn,
      batting_team_name: battingTeam?.name || '',
      bowling_team_name: bowlingTeam?.name || '',
      balls,
      batting,
      bowling,
      fall_of_wickets,
    };
  });

  return { match, innings: inningsData };
}

// --- Records helpers ---

function getAllPlayerStats(): any[] {
  const players = getStore<any>('players');
  return players.map((p: any) => {
    try { return getPlayerStats(p.id); } catch { return null; }
  }).filter(Boolean);
}

export const localStore = {
  getTournaments,
  getTournament,
  createTournament,
  getTeams,
  getTeam,
  createTeam,
  getPlayers,
  getPlayer,
  createPlayer,
  getPlayerStats,
  getMatches,
  getMatch,
  createMatch,
  startMatch,
  recordBall,
  undoLastBall,
  startSecondInnings,
  endMatch,
  getScorecard,
  getAllPlayerStats,
};
