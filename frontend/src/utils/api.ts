const BASE_URL = '/api';

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

export const api = {
  // Tournaments
  getTournaments: () => request<any[]>('/tournaments'),
  getTournament: (id: number) => request<any>(`/tournaments/${id}`),
  createTournament: (data: any) => request<any>('/tournaments', { method: 'POST', body: JSON.stringify(data) }),

  // Teams
  getTeams: (tournamentId?: number) =>
    request<any[]>(tournamentId ? `/teams?tournament_id=${tournamentId}` : '/teams'),
  getTeam: (id: number) => request<any>(`/teams/${id}`),
  createTeam: (data: any) => request<any>('/teams', { method: 'POST', body: JSON.stringify(data) }),

  // Players
  getPlayers: (teamId?: number) =>
    request<any[]>(teamId ? `/players?team_id=${teamId}` : '/players'),
  getPlayer: (id: number) => request<any>(`/players/${id}`),
  createPlayer: (data: any) => request<any>('/players', { method: 'POST', body: JSON.stringify(data) }),
  getPlayerStats: (id: number) => request<any>(`/players/${id}/stats`),

  // Matches
  getMatches: () => request<any[]>('/matches'),
  getMatch: (id: number) => request<any>(`/matches/${id}`),
  createMatch: (data: any) => request<any>('/matches', { method: 'POST', body: JSON.stringify(data) }),
  startMatch: (id: number, data: any) => request<any>(`/matches/${id}/start`, { method: 'POST', body: JSON.stringify(data) }),
  recordBall: (id: number, data: any) => request<any>(`/matches/${id}/ball`, { method: 'POST', body: JSON.stringify(data) }),
  startSecondInnings: (id: number) => request<any>(`/matches/${id}/second-innings`, { method: 'POST', body: JSON.stringify({}) }),
  endMatch: (id: number, data: any) => request<any>(`/matches/${id}/end`, { method: 'POST', body: JSON.stringify(data) }),
  getScorecard: (id: number) => request<any>(`/matches/${id}/scorecard`),
};
