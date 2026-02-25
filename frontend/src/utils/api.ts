import { localStore } from './localStore';

const BASE_URL = '/api';

// Track whether the backend is available to avoid repeated failing requests.
let backendAvailable: boolean | null = null;

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }
  return res.json();
}

async function tryBackend<T>(url: string, options?: RequestInit): Promise<T | null> {
  if (backendAvailable === false) return null;
  try {
    const result = await request<T>(url, options);
    backendAvailable = true;
    return result;
  } catch {
    backendAvailable = false;
    return null;
  }
}

export const api = {
  // Tournaments
  getTournaments: async () => (await tryBackend<any[]>('/tournaments')) ?? localStore.getTournaments(),
  getTournament: async (id: number) => (await tryBackend<any>(`/tournaments/${id}`)) ?? localStore.getTournament(id),
  createTournament: async (data: any) => {
    const result = await tryBackend<any>('/tournaments', { method: 'POST', body: JSON.stringify(data) });
    return result ?? localStore.createTournament(data);
  },

  // Teams
  getTeams: async (tournamentId?: number) => {
    const url = tournamentId ? `/teams?tournament_id=${tournamentId}` : '/teams';
    return (await tryBackend<any[]>(url)) ?? localStore.getTeams(tournamentId);
  },
  getTeam: async (id: number) => (await tryBackend<any>(`/teams/${id}`)) ?? localStore.getTeam(id),
  createTeam: async (data: any) => {
    const result = await tryBackend<any>('/teams', { method: 'POST', body: JSON.stringify(data) });
    return result ?? localStore.createTeam(data);
  },

  // Players
  getPlayers: async (teamId?: number) => {
    const url = teamId ? `/players?team_id=${teamId}` : '/players';
    return (await tryBackend<any[]>(url)) ?? localStore.getPlayers(teamId);
  },
  getPlayer: async (id: number) => (await tryBackend<any>(`/players/${id}`)) ?? localStore.getPlayer(id),
  createPlayer: async (data: any) => {
    const result = await tryBackend<any>('/players', { method: 'POST', body: JSON.stringify(data) });
    return result ?? localStore.createPlayer(data);
  },
  getPlayerStats: async (id: number) => (await tryBackend<any>(`/players/${id}/stats`)) ?? localStore.getPlayerStats(id),

  // Matches
  getMatches: async () => (await tryBackend<any[]>('/matches')) ?? localStore.getMatches(),
  getMatch: async (id: number) => (await tryBackend<any>(`/matches/${id}`)) ?? localStore.getMatch(id),
  createMatch: async (data: any) => {
    const result = await tryBackend<any>('/matches', { method: 'POST', body: JSON.stringify(data) });
    return result ?? localStore.createMatch(data);
  },
  startMatch: async (id: number, data: any) => {
    const result = await tryBackend<any>(`/matches/${id}/start`, { method: 'POST', body: JSON.stringify(data) });
    return result ?? localStore.startMatch(id, data);
  },
  recordBall: async (id: number, data: any) => {
    const result = await tryBackend<any>(`/matches/${id}/ball`, { method: 'POST', body: JSON.stringify(data) });
    return result ?? localStore.recordBall(id, data);
  },
  startSecondInnings: async (id: number) => {
    const result = await tryBackend<any>(`/matches/${id}/second-innings`, { method: 'POST', body: JSON.stringify({}) });
    return result ?? localStore.startSecondInnings(id);
  },
  endMatch: async (id: number, data: any) => {
    const result = await tryBackend<any>(`/matches/${id}/end`, { method: 'POST', body: JSON.stringify(data) });
    return result ?? localStore.endMatch(id, data);
  },
  getScorecard: async (id: number) => (await tryBackend<any>(`/matches/${id}/scorecard`)) ?? localStore.getScorecard(id),
};
