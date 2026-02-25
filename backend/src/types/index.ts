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
}

export interface Team {
  id: number;
  name: string;
  tournament_id: number;
  created_at: string;
}

export interface Player {
  id: number;
  name: string;
  team_id: number;
  role: 'batsman' | 'bowler' | 'all-rounder' | 'wicket-keeper';
  created_at: string;
}

export interface Match {
  id: number;
  tournament_id: number | null;
  team1_id: number;
  team2_id: number;
  overs: number;
  venue: string;
  toss_winner_id: number | null;
  toss_decision: 'bat' | 'bowl' | null;
  status: 'upcoming' | 'in_progress' | 'completed';
  winner_id: number | null;
  match_date: string;
  created_at: string;
}

export interface Innings {
  id: number;
  match_id: number;
  batting_team_id: number;
  bowling_team_id: number;
  innings_number: number;
  total_runs: number;
  total_wickets: number;
  total_overs: number;
  extras: number;
  is_completed: number;
  created_at: string;
}

export interface Ball {
  id: number;
  innings_id: number;
  over_number: number;
  ball_number: number;
  batsman_id: number;
  bowler_id: number;
  runs: number;
  is_extra: number;
  extra_type: 'wide' | 'no-ball' | 'bye' | 'leg-bye' | null;
  extra_runs: number;
  is_wicket: number;
  wicket_type: 'bowled' | 'caught' | 'lbw' | 'run_out' | 'stumped' | 'hit_wicket' | null;
  dismissed_player_id: number | null;
  fielder_id: number | null;
  created_at: string;
}

export interface PlayerMatchStats {
  id: number;
  player_id: number;
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
