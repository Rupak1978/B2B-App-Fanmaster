-- CricLive Seed Data: Demo Tournament + Match
-- Run after schema.sql

-- ============================================================
-- TEAMS
-- ============================================================

INSERT INTO teams (id, name, short_name) VALUES
  ('a1b2c3d4-0001-4000-8000-000000000001', 'Thunder Hawks', 'THK'),
  ('a1b2c3d4-0001-4000-8000-000000000002', 'Storm Riders', 'STR'),
  ('a1b2c3d4-0001-4000-8000-000000000003', 'Blaze Warriors', 'BLZ'),
  ('a1b2c3d4-0001-4000-8000-000000000004', 'Royal Eagles', 'REG');

-- ============================================================
-- PLAYERS (6 per team for demo 6-a-side format)
-- ============================================================

-- Thunder Hawks
INSERT INTO players (id, name, team_id) VALUES
  ('p0000001-0001-4000-8000-000000000001', 'Arjun Sharma', 'a1b2c3d4-0001-4000-8000-000000000001'),
  ('p0000001-0001-4000-8000-000000000002', 'Rohit Patel', 'a1b2c3d4-0001-4000-8000-000000000001'),
  ('p0000001-0001-4000-8000-000000000003', 'Vikram Singh', 'a1b2c3d4-0001-4000-8000-000000000001'),
  ('p0000001-0001-4000-8000-000000000004', 'Anil Kumar', 'a1b2c3d4-0001-4000-8000-000000000001'),
  ('p0000001-0001-4000-8000-000000000005', 'Suresh Reddy', 'a1b2c3d4-0001-4000-8000-000000000001'),
  ('p0000001-0001-4000-8000-000000000006', 'Deepak Yadav', 'a1b2c3d4-0001-4000-8000-000000000001');

-- Storm Riders
INSERT INTO players (id, name, team_id) VALUES
  ('p0000002-0001-4000-8000-000000000001', 'Karthik Nair', 'a1b2c3d4-0001-4000-8000-000000000002'),
  ('p0000002-0001-4000-8000-000000000002', 'Ravi Iyer', 'a1b2c3d4-0001-4000-8000-000000000002'),
  ('p0000002-0001-4000-8000-000000000003', 'Manish Pandey', 'a1b2c3d4-0001-4000-8000-000000000002'),
  ('p0000002-0001-4000-8000-000000000004', 'Sanjay Gupta', 'a1b2c3d4-0001-4000-8000-000000000002'),
  ('p0000002-0001-4000-8000-000000000005', 'Amit Mishra', 'a1b2c3d4-0001-4000-8000-000000000002'),
  ('p0000002-0001-4000-8000-000000000006', 'Rahul Verma', 'a1b2c3d4-0001-4000-8000-000000000002');

-- Blaze Warriors
INSERT INTO players (id, name, team_id) VALUES
  ('p0000003-0001-4000-8000-000000000001', 'Pranav Desai', 'a1b2c3d4-0001-4000-8000-000000000003'),
  ('p0000003-0001-4000-8000-000000000002', 'Naveen Joshi', 'a1b2c3d4-0001-4000-8000-000000000003'),
  ('p0000003-0001-4000-8000-000000000003', 'Yash Kapoor', 'a1b2c3d4-0001-4000-8000-000000000003'),
  ('p0000003-0001-4000-8000-000000000004', 'Gaurav Thakur', 'a1b2c3d4-0001-4000-8000-000000000003'),
  ('p0000003-0001-4000-8000-000000000005', 'Nikhil Saxena', 'a1b2c3d4-0001-4000-8000-000000000003'),
  ('p0000003-0001-4000-8000-000000000006', 'Rajesh Menon', 'a1b2c3d4-0001-4000-8000-000000000003');

-- Royal Eagles
INSERT INTO players (id, name, team_id) VALUES
  ('p0000004-0001-4000-8000-000000000001', 'Ashwin Pillai', 'a1b2c3d4-0001-4000-8000-000000000004'),
  ('p0000004-0001-4000-8000-000000000002', 'Tarun Malhotra', 'a1b2c3d4-0001-4000-8000-000000000004'),
  ('p0000004-0001-4000-8000-000000000003', 'Varun Dhawan', 'a1b2c3d4-0001-4000-8000-000000000004'),
  ('p0000004-0001-4000-8000-000000000004', 'Siddhant Roy', 'a1b2c3d4-0001-4000-8000-000000000004'),
  ('p0000004-0001-4000-8000-000000000005', 'Harsh Trivedi', 'a1b2c3d4-0001-4000-8000-000000000004'),
  ('p0000004-0001-4000-8000-000000000006', 'Mohan Das', 'a1b2c3d4-0001-4000-8000-000000000004');

-- ============================================================
-- TOURNAMENT
-- ============================================================

INSERT INTO tournaments (id, name, default_rules_json, teams_json, match_ids_json, status) VALUES
  ('t0000001-0001-4000-8000-000000000001',
   'Sunday Sixer League 2026',
   '{"oversPerInnings": 8, "playersPerTeam": 6, "wideExtraBall": true, "noBallExtraBall": true, "powerBallEnabled": true, "powerBallStartOver": -1, "powerBallEndOver": null, "maxPowerBallsPerInnings": -1, "powerBallWicketDeduction": 5, "powerBallDoublesAll": true, "freeHitOnNoBall": false}',
   '["a1b2c3d4-0001-4000-8000-000000000001", "a1b2c3d4-0001-4000-8000-000000000002", "a1b2c3d4-0001-4000-8000-000000000003", "a1b2c3d4-0001-4000-8000-000000000004"]',
   '["m0000001-0001-4000-8000-000000000001"]',
   1
  );

-- ============================================================
-- DEMO MATCH: Thunder Hawks vs Storm Riders
-- ============================================================

INSERT INTO matches (id, tournament_id, team1_id, team2_id, rules_json, status, toss_winner_id, toss_decision, result, result_description, started_at, completed_at) VALUES
  ('m0000001-0001-4000-8000-000000000001',
   't0000001-0001-4000-8000-000000000001',
   'a1b2c3d4-0001-4000-8000-000000000001',
   'a1b2c3d4-0001-4000-8000-000000000002',
   '{"oversPerInnings": 8, "playersPerTeam": 6, "wideExtraBall": true, "noBallExtraBall": true, "powerBallEnabled": true, "powerBallStartOver": -1, "maxPowerBallsPerInnings": -1, "powerBallWicketDeduction": 5, "powerBallDoublesAll": true}',
   2, -- completed
   'a1b2c3d4-0001-4000-8000-000000000001',
   0, -- bat
   0, -- team1 won
   'Thunder Hawks won by 15 runs',
   NOW() - INTERVAL '2 hours',
   NOW() - INTERVAL '1 hour'
  );

-- First Innings: Thunder Hawks batting
INSERT INTO innings (id, match_id, innings_number, batting_team_id, bowling_team_id, status) VALUES
  ('i0000001-0001-4000-8000-000000000001',
   'm0000001-0001-4000-8000-000000000001',
   1,
   'a1b2c3d4-0001-4000-8000-000000000001',
   'a1b2c3d4-0001-4000-8000-000000000002',
   2 -- completed
  );

-- Second Innings: Storm Riders batting
INSERT INTO innings (id, match_id, innings_number, batting_team_id, bowling_team_id, status, target) VALUES
  ('i0000001-0001-4000-8000-000000000002',
   'm0000001-0001-4000-8000-000000000001',
   2,
   'a1b2c3d4-0001-4000-8000-000000000002',
   'a1b2c3d4-0001-4000-8000-000000000001',
   2, -- completed
   86 -- target
  );

-- Sample ball events for first over (Thunder Hawks batting)
INSERT INTO ball_events (id, match_id, innings_id, over_number, ball_number, legal_ball_number, is_legal, striker_id, non_striker_id, bowler_id, runs_off_bat, extra_runs, extra_type, total_runs, boundary_type, is_wicket, is_power_ball, power_ball_multiplier, timestamp) VALUES
  ('be000001-0001-4000-8000-000000000001', 'm0000001-0001-4000-8000-000000000001', 'i0000001-0001-4000-8000-000000000001', 0, 1, 1, TRUE, 'p0000001-0001-4000-8000-000000000001', 'p0000001-0001-4000-8000-000000000002', 'p0000002-0001-4000-8000-000000000001', 4, 0, 0, 4, 1, FALSE, FALSE, 1, NOW() - INTERVAL '120 minutes'),
  ('be000001-0001-4000-8000-000000000002', 'm0000001-0001-4000-8000-000000000001', 'i0000001-0001-4000-8000-000000000001', 0, 2, 2, TRUE, 'p0000001-0001-4000-8000-000000000001', 'p0000001-0001-4000-8000-000000000002', 'p0000002-0001-4000-8000-000000000001', 1, 0, 0, 1, 0, FALSE, FALSE, 1, NOW() - INTERVAL '119 minutes'),
  ('be000001-0001-4000-8000-000000000003', 'm0000001-0001-4000-8000-000000000001', 'i0000001-0001-4000-8000-000000000001', 0, 3, 3, TRUE, 'p0000001-0001-4000-8000-000000000002', 'p0000001-0001-4000-8000-000000000001', 'p0000002-0001-4000-8000-000000000001', 0, 0, 0, 0, 0, FALSE, FALSE, 1, NOW() - INTERVAL '118 minutes'),
  ('be000001-0001-4000-8000-000000000004', 'm0000001-0001-4000-8000-000000000001', 'i0000001-0001-4000-8000-000000000001', 0, 4, 4, TRUE, 'p0000001-0001-4000-8000-000000000002', 'p0000001-0001-4000-8000-000000000001', 'p0000002-0001-4000-8000-000000000001', 6, 0, 0, 6, 2, FALSE, FALSE, 1, NOW() - INTERVAL '117 minutes'),
  ('be000001-0001-4000-8000-000000000005', 'm0000001-0001-4000-8000-000000000001', 'i0000001-0001-4000-8000-000000000001', 0, 5, 4, FALSE, 'p0000001-0001-4000-8000-000000000002', 'p0000001-0001-4000-8000-000000000001', 'p0000002-0001-4000-8000-000000000001', 0, 1, 1, 1, 0, FALSE, FALSE, 1, NOW() - INTERVAL '116 minutes'),
  ('be000001-0001-4000-8000-000000000006', 'm0000001-0001-4000-8000-000000000001', 'i0000001-0001-4000-8000-000000000001', 0, 6, 5, TRUE, 'p0000001-0001-4000-8000-000000000002', 'p0000001-0001-4000-8000-000000000001', 'p0000002-0001-4000-8000-000000000001', 2, 0, 0, 2, 0, FALSE, FALSE, 1, NOW() - INTERVAL '115 minutes'),
  ('be000001-0001-4000-8000-000000000007', 'm0000001-0001-4000-8000-000000000001', 'i0000001-0001-4000-8000-000000000001', 0, 7, 6, TRUE, 'p0000001-0001-4000-8000-000000000001', 'p0000001-0001-4000-8000-000000000002', 'p0000002-0001-4000-8000-000000000001', 1, 0, 0, 1, 0, FALSE, FALSE, 1, NOW() - INTERVAL '114 minutes');

-- A power ball delivery in the last over (over 7, 0-indexed)
INSERT INTO ball_events (id, match_id, innings_id, over_number, ball_number, legal_ball_number, is_legal, striker_id, non_striker_id, bowler_id, runs_off_bat, extra_runs, extra_type, total_runs, boundary_type, is_wicket, is_power_ball, power_ball_multiplier, power_ball_wicket_deduction_applied, power_ball_deduction_amount, timestamp) VALUES
  ('be000001-0001-4000-8000-000000000050', 'm0000001-0001-4000-8000-000000000001', 'i0000001-0001-4000-8000-000000000001', 7, 1, 1, TRUE, 'p0000001-0001-4000-8000-000000000001', 'p0000001-0001-4000-8000-000000000003', 'p0000002-0001-4000-8000-000000000003', 6, 0, 0, 12, 2, FALSE, TRUE, 2, FALSE, 0, NOW() - INTERVAL '65 minutes');

-- ============================================================
-- DONE
-- ============================================================
-- To run: psql -d criclive -f schema.sql && psql -d criclive -f seed.sql
