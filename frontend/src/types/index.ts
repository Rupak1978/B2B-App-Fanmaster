export interface Tournament {
  id: number;
  name: string;
  format: 'T20' | 'ODI' | 'Test';
  tournament_type: 'League' | 'Knockout' | 'Round Robin';
  start_date: string;
  venue: string;
  num_teams: number;
  status: 'upcoming' | 'in_progress' | 'completed';
  created_at: string;
  teams?: Team[];
  matches?: Match[];
}

export interface Team {
  id: number;
  name: string;
  tournament_id: number | null;
  created_at: string;
  players?: Player[];
}

export interface Player {
  id: number;
  name: string;
  team_id: number | null;
  team_name?: string;
  role: 'batsman' | 'bowler' | 'all-rounder' | 'wicket-keeper';
  created_at: string;
}

export interface Match {
  id: number;
  tournament_id: number | null;
  team1_id: number;
  team2_id: number;
  team1_name?: string;
  team2_name?: string;
  overs: number;
  venue: string;
  toss_winner_id: number | null;
  toss_winner_name?: string;
  toss_decision: 'bat' | 'bowl' | null;
  status: 'upcoming' | 'in_progress' | 'completed';
  winner_id: number | null;
  winner_name?: string;
  match_date: string;
  created_at: string;
  innings?: Innings[];
}

export interface Innings {
  id: number;
  match_id: number;
  batting_team_id: number;
  bowling_team_id: number;
  batting_team_name?: string;
  bowling_team_name?: string;
  innings_number: number;
  total_runs: number;
  total_wickets: number;
  total_overs: number;
  extras: number;
  is_completed: number;
  created_at: string;
  batting?: PlayerMatchStats[];
  bowling?: PlayerMatchStats[];
  balls?: BallEvent[];
}

export interface BallEvent {
  id: number;
  innings_id: number;
  over_number: number;
  ball_number: number;
  batsman_id: number;
  batsman_name?: string;
  bowler_id: number;
  bowler_name?: string;
  runs: number;
  is_extra: number;
  extra_type: 'wide' | 'no-ball' | 'bye' | 'leg-bye' | null;
  extra_runs: number;
  is_wicket: number;
  wicket_type: 'bowled' | 'caught' | 'lbw' | 'run_out' | 'stumped' | 'hit_wicket' | null;
  dismissed_player_id: number | null;
  dismissed_player_name?: string;
  fielder_id: number | null;
  fielder_name?: string;
  created_at: string;
}

export interface PlayerMatchStats {
  id: number;
  player_id: number;
  player_name?: string;
  role?: string;
  match_id: number;
  innings_id: number;
  runs_scored: number;
  balls_faced: number;
  fours: number;
  sixes: number;
  overs_bowled: number;
  runs_conceded: number;
  wickets_taken: number;
  maidens: number;
  catches: number;
  run_outs: number;
  stumpings: number;
  created_at: string;
}

export interface PlayerStats extends Player {
  batting: {
    matches: number;
    runs: number;
    balls_faced: number;
    fours: number;
    sixes: number;
    highest_score: number;
    average: string;
    strike_rate: string;
  };
  bowling: {
    overs: number;
    runs_conceded: number;
    wickets: number;
    maidens: number;
    economy: string;
    average: string;
    best_wickets: number;
    best_figures_runs: number;
    five_wicket_hauls: number;
  };
  match_history: PlayerMatchStats[];
}
