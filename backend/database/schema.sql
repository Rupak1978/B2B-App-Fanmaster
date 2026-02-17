-- CricLive Database Schema
-- PostgreSQL

-- Teams
CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    short_name VARCHAR(10),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Players
CREATE TABLE IF NOT EXISTS players (
    id UUID PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_players_team ON players(team_id);

-- Tournaments
CREATE TABLE IF NOT EXISTS tournaments (
    id UUID PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    default_rules_json JSONB NOT NULL,
    teams_json JSONB DEFAULT '[]',
    match_ids_json JSONB DEFAULT '[]',
    status INTEGER NOT NULL DEFAULT 0, -- 0=upcoming, 1=in_progress, 2=completed
    created_at TIMESTAMP DEFAULT NOW()
);

-- Matches
CREATE TABLE IF NOT EXISTS matches (
    id UUID PRIMARY KEY,
    tournament_id UUID REFERENCES tournaments(id) ON DELETE SET NULL,
    team1_id UUID NOT NULL REFERENCES teams(id),
    team2_id UUID NOT NULL REFERENCES teams(id),
    rules_json JSONB NOT NULL,
    status INTEGER NOT NULL DEFAULT 0, -- 0=not_started, 1=in_progress, 2=completed, 3=abandoned
    toss_decision INTEGER, -- 0=bat, 1=bowl
    toss_winner_id UUID REFERENCES teams(id),
    result INTEGER, -- 0=team1_won, 1=team2_won, 2=tie, 3=no_result
    result_description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    started_at TIMESTAMP,
    completed_at TIMESTAMP
);

CREATE INDEX idx_matches_tournament ON matches(tournament_id);
CREATE INDEX idx_matches_status ON matches(status);

-- Innings
CREATE TABLE IF NOT EXISTS innings (
    id UUID PRIMARY KEY,
    match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    innings_number INTEGER NOT NULL CHECK (innings_number IN (1, 2)),
    batting_team_id UUID NOT NULL REFERENCES teams(id),
    bowling_team_id UUID NOT NULL REFERENCES teams(id),
    status INTEGER NOT NULL DEFAULT 0, -- 0=not_started, 1=in_progress, 2=completed
    target INTEGER, -- set for 2nd innings
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_innings_match ON innings(match_id);

-- Ball Events (single source of truth)
CREATE TABLE IF NOT EXISTS ball_events (
    id UUID PRIMARY KEY,
    match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    innings_id UUID NOT NULL REFERENCES innings(id) ON DELETE CASCADE,
    over_number INTEGER NOT NULL,
    ball_number INTEGER NOT NULL,
    legal_ball_number INTEGER NOT NULL,
    is_legal BOOLEAN NOT NULL DEFAULT TRUE,
    striker_id UUID NOT NULL REFERENCES players(id),
    non_striker_id UUID NOT NULL REFERENCES players(id),
    bowler_id UUID NOT NULL REFERENCES players(id),
    runs_off_bat INTEGER NOT NULL DEFAULT 0,
    extra_runs INTEGER NOT NULL DEFAULT 0,
    extra_type INTEGER NOT NULL DEFAULT 0, -- 0=none, 1=wide, 2=no_ball, 3=bye, 4=leg_bye
    total_runs INTEGER NOT NULL DEFAULT 0,
    boundary_type INTEGER NOT NULL DEFAULT 0, -- 0=none, 1=four, 2=six
    is_wicket BOOLEAN NOT NULL DEFAULT FALSE,
    wicket_type INTEGER, -- 0=bowled, 1=caught, 2=lbw, 3=run_out, 4=stumped, 5=hit_wicket, 6=retired_hurt
    fielder_name VARCHAR(100),
    dismissed_player_id UUID REFERENCES players(id),
    is_power_ball BOOLEAN NOT NULL DEFAULT FALSE,
    power_ball_multiplier INTEGER NOT NULL DEFAULT 1,
    power_ball_wicket_deduction_applied BOOLEAN NOT NULL DEFAULT FALSE,
    power_ball_deduction_amount INTEGER NOT NULL DEFAULT 0,
    timestamp TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ball_events_match ON ball_events(match_id);
CREATE INDEX idx_ball_events_innings ON ball_events(innings_id);
CREATE INDEX idx_ball_events_timestamp ON ball_events(timestamp);

-- Penalty Events
CREATE TABLE IF NOT EXISTS penalty_events (
    id UUID PRIMARY KEY,
    match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    innings_id UUID NOT NULL REFERENCES innings(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES teams(id),
    runs INTEGER NOT NULL,
    reason TEXT NOT NULL,
    timestamp TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_penalty_events_match ON penalty_events(match_id);

-- =============================================================
-- VIEWS for common queries
-- =============================================================

-- Live scoreboard view
CREATE OR REPLACE VIEW v_live_score AS
SELECT
    i.id AS innings_id,
    i.match_id,
    i.innings_number,
    i.batting_team_id,
    i.bowling_team_id,
    i.target,
    COALESCE(SUM(be.total_runs), 0) AS total_runs,
    COALESCE(COUNT(CASE WHEN be.is_wicket = TRUE AND be.wicket_type != 6 THEN 1 END), 0) AS wickets,
    COALESCE(COUNT(CASE WHEN be.is_legal = TRUE THEN 1 END), 0) AS legal_balls,
    CASE
        WHEN COUNT(CASE WHEN be.is_legal = TRUE THEN 1 END) > 0
        THEN ROUND((SUM(be.total_runs)::NUMERIC / COUNT(CASE WHEN be.is_legal = TRUE THEN 1 END)) * 6, 2)
        ELSE 0
    END AS current_run_rate
FROM innings i
LEFT JOIN ball_events be ON be.innings_id = i.id
GROUP BY i.id;

-- Batting stats view
CREATE OR REPLACE VIEW v_batting_stats AS
SELECT
    be.innings_id,
    be.striker_id AS player_id,
    p.name AS player_name,
    SUM(CASE WHEN be.extra_type NOT IN (1) THEN 1 ELSE 0 END) AS balls_faced,
    SUM(be.runs_off_bat * be.power_ball_multiplier) AS runs,
    COUNT(CASE WHEN be.boundary_type = 1 THEN 1 END) AS fours,
    COUNT(CASE WHEN be.boundary_type = 2 THEN 1 END) AS sixes,
    CASE
        WHEN SUM(CASE WHEN be.extra_type NOT IN (1) THEN 1 ELSE 0 END) > 0
        THEN ROUND(
            (SUM(be.runs_off_bat * be.power_ball_multiplier)::NUMERIC /
             SUM(CASE WHEN be.extra_type NOT IN (1) THEN 1 ELSE 0 END)) * 100, 2)
        ELSE 0
    END AS strike_rate
FROM ball_events be
JOIN players p ON p.id = be.striker_id
GROUP BY be.innings_id, be.striker_id, p.name;

-- Bowling stats view
CREATE OR REPLACE VIEW v_bowling_stats AS
SELECT
    be.innings_id,
    be.bowler_id AS player_id,
    p.name AS player_name,
    COUNT(CASE WHEN be.is_legal = TRUE THEN 1 END) AS legal_balls,
    FLOOR(COUNT(CASE WHEN be.is_legal = TRUE THEN 1 END) / 6) AS completed_overs,
    COUNT(CASE WHEN be.is_legal = TRUE THEN 1 END) % 6 AS balls_in_current_over,
    SUM(be.total_runs) AS runs_conceded,
    COUNT(CASE WHEN be.is_wicket = TRUE AND be.wicket_type NOT IN (3, 6) THEN 1 END) AS wickets,
    COUNT(CASE WHEN be.extra_type = 1 THEN 1 END) AS wides,
    COUNT(CASE WHEN be.extra_type = 2 THEN 1 END) AS no_balls,
    CASE
        WHEN COUNT(CASE WHEN be.is_legal = TRUE THEN 1 END) > 0
        THEN ROUND((SUM(be.total_runs)::NUMERIC / COUNT(CASE WHEN be.is_legal = TRUE THEN 1 END)) * 6, 2)
        ELSE 0
    END AS economy
FROM ball_events be
JOIN players p ON p.id = be.bowler_id
GROUP BY be.innings_id, be.bowler_id, p.name;
