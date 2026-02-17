import 'dart:convert';
import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';
import '../models/ball_event.dart';
import '../models/match.dart';
import '../models/match_rules.dart';
import '../models/innings.dart';
import '../models/player.dart';
import '../models/team.dart';
import '../models/tournament.dart';
import '../utils/enums.dart';

class DatabaseHelper {
  static final DatabaseHelper _instance = DatabaseHelper._internal();
  factory DatabaseHelper() => _instance;
  DatabaseHelper._internal();

  static Database? _database;

  Future<Database> get database async {
    if (_database != null) return _database!;
    _database = await _initDatabase();
    return _database!;
  }

  Future<Database> _initDatabase() async {
    final dbPath = await getDatabasesPath();
    final path = join(dbPath, 'criclive.db');

    return await openDatabase(
      path,
      version: 1,
      onCreate: _onCreate,
    );
  }

  Future<void> _onCreate(Database db, int version) async {
    await db.execute('''
      CREATE TABLE teams (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        short_name TEXT,
        players_json TEXT
      )
    ''');

    await db.execute('''
      CREATE TABLE matches (
        id TEXT PRIMARY KEY,
        tournament_id TEXT,
        team1_id TEXT NOT NULL,
        team2_id TEXT NOT NULL,
        rules_json TEXT NOT NULL,
        status INTEGER NOT NULL DEFAULT 0,
        toss_decision INTEGER,
        toss_winner_id TEXT,
        result INTEGER,
        result_description TEXT,
        created_at TEXT NOT NULL,
        started_at TEXT,
        completed_at TEXT,
        FOREIGN KEY (team1_id) REFERENCES teams(id),
        FOREIGN KEY (team2_id) REFERENCES teams(id)
      )
    ''');

    await db.execute('''
      CREATE TABLE innings (
        id TEXT PRIMARY KEY,
        match_id TEXT NOT NULL,
        innings_number INTEGER NOT NULL,
        batting_team_id TEXT NOT NULL,
        bowling_team_id TEXT NOT NULL,
        status INTEGER NOT NULL DEFAULT 0,
        target INTEGER,
        FOREIGN KEY (match_id) REFERENCES matches(id)
      )
    ''');

    await db.execute('''
      CREATE TABLE ball_events (
        id TEXT PRIMARY KEY,
        match_id TEXT NOT NULL,
        innings_id TEXT NOT NULL,
        over_number INTEGER NOT NULL,
        ball_number INTEGER NOT NULL,
        legal_ball_number INTEGER NOT NULL,
        is_legal INTEGER NOT NULL,
        striker_id TEXT NOT NULL,
        non_striker_id TEXT NOT NULL,
        bowler_id TEXT NOT NULL,
        runs_off_bat INTEGER NOT NULL DEFAULT 0,
        extra_runs INTEGER NOT NULL DEFAULT 0,
        extra_type INTEGER NOT NULL DEFAULT 0,
        total_runs INTEGER NOT NULL DEFAULT 0,
        boundary_type INTEGER NOT NULL DEFAULT 0,
        is_wicket INTEGER NOT NULL DEFAULT 0,
        wicket_type INTEGER,
        fielder_name TEXT,
        dismissed_player_id TEXT,
        is_power_ball INTEGER NOT NULL DEFAULT 0,
        power_ball_multiplier INTEGER NOT NULL DEFAULT 1,
        power_ball_wicket_deduction_applied INTEGER NOT NULL DEFAULT 0,
        power_ball_deduction_amount INTEGER NOT NULL DEFAULT 0,
        timestamp TEXT NOT NULL,
        FOREIGN KEY (match_id) REFERENCES matches(id),
        FOREIGN KEY (innings_id) REFERENCES innings(id)
      )
    ''');

    await db.execute('''
      CREATE TABLE penalty_events (
        id TEXT PRIMARY KEY,
        match_id TEXT NOT NULL,
        innings_id TEXT NOT NULL,
        team_id TEXT NOT NULL,
        runs INTEGER NOT NULL,
        reason TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        FOREIGN KEY (match_id) REFERENCES matches(id)
      )
    ''');

    await db.execute('''
      CREATE TABLE tournaments (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        default_rules_json TEXT NOT NULL,
        teams_json TEXT,
        match_ids_json TEXT,
        status INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL
      )
    ''');

    // Indexes for fast queries
    await db.execute(
        'CREATE INDEX idx_ball_events_match ON ball_events(match_id)');
    await db.execute(
        'CREATE INDEX idx_ball_events_innings ON ball_events(innings_id)');
    await db.execute(
        'CREATE INDEX idx_innings_match ON innings(match_id)');
    await db.execute(
        'CREATE INDEX idx_matches_tournament ON matches(tournament_id)');
  }

  // ---- Team operations ----

  Future<void> insertTeam(Team team) async {
    final db = await database;
    await db.insert('teams', {
      'id': team.id,
      'name': team.name,
      'short_name': team.shortName,
      'players_json': jsonEncode(team.players.map((p) => p.toJson()).toList()),
    });
  }

  Future<Team?> getTeam(String id) async {
    final db = await database;
    final maps = await db.query('teams', where: 'id = ?', whereArgs: [id]);
    if (maps.isEmpty) return null;
    final row = maps.first;
    final players = (jsonDecode(row['players_json'] as String? ?? '[]')
            as List<dynamic>)
        .map((p) => Player.fromJson(p as Map<String, dynamic>))
        .toList();
    return Team(
      id: row['id'] as String,
      name: row['name'] as String,
      shortName: row['short_name'] as String?,
      players: players,
    );
  }

  Future<List<Team>> getAllTeams() async {
    final db = await database;
    final maps = await db.query('teams');
    return maps.map((row) {
      final players = (jsonDecode(row['players_json'] as String? ?? '[]')
              as List<dynamic>)
          .map((p) => Player.fromJson(p as Map<String, dynamic>))
          .toList();
      return Team(
        id: row['id'] as String,
        name: row['name'] as String,
        shortName: row['short_name'] as String?,
        players: players,
      );
    }).toList();
  }

  // ---- Match operations ----

  Future<void> insertMatch(CricketMatch match) async {
    final db = await database;
    await db.insert('matches', {
      'id': match.id,
      'tournament_id': match.tournamentId,
      'team1_id': match.team1.id,
      'team2_id': match.team2.id,
      'rules_json': jsonEncode(match.rules.toJson()),
      'status': match.status.index,
      'toss_decision': match.tossDecision?.index,
      'toss_winner_id': match.tossWinnerId,
      'result': match.result?.index,
      'result_description': match.resultDescription,
      'created_at': match.createdAt.toIso8601String(),
      'started_at': match.startedAt?.toIso8601String(),
      'completed_at': match.completedAt?.toIso8601String(),
    });
  }

  Future<void> updateMatchStatus(
      String matchId, MatchStatus status, {MatchResult? result, String? resultDescription}) async {
    final db = await database;
    final values = <String, dynamic>{'status': status.index};
    if (result != null) values['result'] = result.index;
    if (resultDescription != null) values['result_description'] = resultDescription;
    if (status == MatchStatus.inProgress) {
      values['started_at'] = DateTime.now().toIso8601String();
    }
    if (status == MatchStatus.completed) {
      values['completed_at'] = DateTime.now().toIso8601String();
    }
    await db.update('matches', values, where: 'id = ?', whereArgs: [matchId]);
  }

  Future<CricketMatch?> getMatch(String matchId) async {
    final db = await database;
    final maps =
        await db.query('matches', where: 'id = ?', whereArgs: [matchId]);
    if (maps.isEmpty) return null;
    final row = maps.first;

    final team1 = await getTeam(row['team1_id'] as String);
    final team2 = await getTeam(row['team2_id'] as String);
    if (team1 == null || team2 == null) return null;

    final innings = await getInningsForMatch(matchId);
    final penalties = await getPenaltiesForMatch(matchId);

    final match = CricketMatch(
      id: row['id'] as String,
      tournamentId: row['tournament_id'] as String?,
      team1: team1,
      team2: team2,
      rules: MatchRules.fromJson(
          jsonDecode(row['rules_json'] as String) as Map<String, dynamic>),
      status: MatchStatus.values[row['status'] as int],
      tossDecision: row['toss_decision'] != null
          ? TossDecision.values[row['toss_decision'] as int]
          : null,
      tossWinnerId: row['toss_winner_id'] as String?,
      result: row['result'] != null
          ? MatchResult.values[row['result'] as int]
          : null,
      resultDescription: row['result_description'] as String?,
      createdAt: DateTime.parse(row['created_at'] as String),
      startedAt: row['started_at'] != null
          ? DateTime.parse(row['started_at'] as String)
          : null,
      completedAt: row['completed_at'] != null
          ? DateTime.parse(row['completed_at'] as String)
          : null,
      penalties: penalties,
    );

    if (innings.isNotEmpty) match.innings1 = innings[0];
    if (innings.length > 1) match.innings2 = innings[1];

    return match;
  }

  Future<List<CricketMatch>> getAllMatches() async {
    final db = await database;
    final maps = await db.query('matches', orderBy: 'created_at DESC');
    final matches = <CricketMatch>[];
    for (final row in maps) {
      final match = await getMatch(row['id'] as String);
      if (match != null) matches.add(match);
    }
    return matches;
  }

  // ---- Innings operations ----

  Future<void> insertInnings(Innings innings) async {
    final db = await database;
    await db.insert('innings', {
      'id': innings.id,
      'match_id': innings.matchId,
      'innings_number': innings.inningsNumber,
      'batting_team_id': innings.battingTeamId,
      'bowling_team_id': innings.bowlingTeamId,
      'status': innings.status.index,
      'target': innings.target,
    });
  }

  Future<void> updateInningsStatus(String inningsId, InningsStatus status,
      {int? target}) async {
    final db = await database;
    final values = <String, dynamic>{'status': status.index};
    if (target != null) values['target'] = target;
    await db.update('innings', values, where: 'id = ?', whereArgs: [inningsId]);
  }

  Future<List<Innings>> getInningsForMatch(String matchId) async {
    final db = await database;
    final maps = await db.query('innings',
        where: 'match_id = ?',
        whereArgs: [matchId],
        orderBy: 'innings_number ASC');

    final result = <Innings>[];
    for (final row in maps) {
      final innings = Innings.fromJson({
        'id': row['id'],
        'matchId': row['match_id'],
        'inningsNumber': row['innings_number'],
        'battingTeamId': row['batting_team_id'],
        'bowlingTeamId': row['bowling_team_id'],
        'status': row['status'],
        'target': row['target'],
      });

      // Load ball events for this innings
      final balls = await getBallEventsForInnings(row['id'] as String);
      innings.ballEvents.addAll(balls);
      result.add(innings);
    }
    return result;
  }

  // ---- Ball event operations ----

  Future<void> insertBallEvent(BallEvent event) async {
    final db = await database;
    await db.insert('ball_events', {
      'id': event.id,
      'match_id': event.matchId,
      'innings_id': event.inningsId,
      'over_number': event.overNumber,
      'ball_number': event.ballNumber,
      'legal_ball_number': event.legalBallNumber,
      'is_legal': event.isLegal ? 1 : 0,
      'striker_id': event.strikerId,
      'non_striker_id': event.nonStrikerId,
      'bowler_id': event.bowlerId,
      'runs_off_bat': event.runsOffBat,
      'extra_runs': event.extraRuns,
      'extra_type': event.extraType.index,
      'total_runs': event.totalRuns,
      'boundary_type': event.boundaryType.index,
      'is_wicket': event.isWicket ? 1 : 0,
      'wicket_type': event.wicketType?.index,
      'fielder_name': event.fielderName,
      'dismissed_player_id': event.dismissedPlayerId,
      'is_power_ball': event.isPowerBall ? 1 : 0,
      'power_ball_multiplier': event.powerBallMultiplier,
      'power_ball_wicket_deduction_applied':
          event.powerBallWicketDeductionApplied ? 1 : 0,
      'power_ball_deduction_amount': event.powerBallDeductionAmount,
      'timestamp': event.timestamp.toIso8601String(),
    });
  }

  Future<void> deleteBallEvent(String id) async {
    final db = await database;
    await db.delete('ball_events', where: 'id = ?', whereArgs: [id]);
  }

  Future<BallEvent?> getLastBallEvent(String inningsId) async {
    final db = await database;
    final maps = await db.query(
      'ball_events',
      where: 'innings_id = ?',
      whereArgs: [inningsId],
      orderBy: 'timestamp DESC',
      limit: 1,
    );
    if (maps.isEmpty) return null;
    return _ballEventFromRow(maps.first);
  }

  Future<List<BallEvent>> getBallEventsForInnings(String inningsId) async {
    final db = await database;
    final maps = await db.query(
      'ball_events',
      where: 'innings_id = ?',
      whereArgs: [inningsId],
      orderBy: 'timestamp ASC',
    );
    return maps.map(_ballEventFromRow).toList();
  }

  BallEvent _ballEventFromRow(Map<String, dynamic> row) {
    return BallEvent(
      id: row['id'] as String,
      matchId: row['match_id'] as String,
      inningsId: row['innings_id'] as String,
      overNumber: row['over_number'] as int,
      ballNumber: row['ball_number'] as int,
      legalBallNumber: row['legal_ball_number'] as int,
      isLegal: (row['is_legal'] as int) == 1,
      strikerId: row['striker_id'] as String,
      nonStrikerId: row['non_striker_id'] as String,
      bowlerId: row['bowler_id'] as String,
      runsOffBat: row['runs_off_bat'] as int,
      extraRuns: row['extra_runs'] as int,
      extraType: ExtraType.values[row['extra_type'] as int],
      totalRuns: row['total_runs'] as int,
      boundaryType: BoundaryType.values[row['boundary_type'] as int],
      isWicket: (row['is_wicket'] as int) == 1,
      wicketType: row['wicket_type'] != null
          ? WicketType.values[row['wicket_type'] as int]
          : null,
      fielderName: row['fielder_name'] as String?,
      dismissedPlayerId: row['dismissed_player_id'] as String?,
      isPowerBall: (row['is_power_ball'] as int) == 1,
      powerBallMultiplier: row['power_ball_multiplier'] as int,
      powerBallWicketDeductionApplied:
          (row['power_ball_wicket_deduction_applied'] as int) == 1,
      powerBallDeductionAmount: row['power_ball_deduction_amount'] as int,
      timestamp: DateTime.parse(row['timestamp'] as String),
    );
  }

  // ---- Penalty operations ----

  Future<void> insertPenalty(PenaltyEvent penalty) async {
    final db = await database;
    await db.insert('penalty_events', {
      'id': penalty.id,
      'match_id': penalty.matchId,
      'innings_id': penalty.inningsId,
      'team_id': penalty.teamId,
      'runs': penalty.runs,
      'reason': penalty.reason,
      'timestamp': penalty.timestamp.toIso8601String(),
    });
  }

  Future<List<PenaltyEvent>> getPenaltiesForMatch(String matchId) async {
    final db = await database;
    final maps = await db.query('penalty_events',
        where: 'match_id = ?', whereArgs: [matchId]);
    return maps
        .map((row) => PenaltyEvent(
              id: row['id'] as String,
              matchId: row['match_id'] as String,
              inningsId: row['innings_id'] as String,
              teamId: row['team_id'] as String,
              runs: row['runs'] as int,
              reason: row['reason'] as String,
              timestamp: DateTime.parse(row['timestamp'] as String),
            ))
        .toList();
  }

  // ---- Tournament operations ----

  Future<void> insertTournament(Tournament tournament) async {
    final db = await database;
    await db.insert('tournaments', {
      'id': tournament.id,
      'name': tournament.name,
      'default_rules_json': jsonEncode(tournament.defaultRules.toJson()),
      'teams_json':
          jsonEncode(tournament.teams.map((t) => t.toJson()).toList()),
      'match_ids_json': jsonEncode(tournament.matchIds),
      'status': tournament.status.index,
      'created_at': tournament.createdAt.toIso8601String(),
    });
  }

  Future<List<Tournament>> getAllTournaments() async {
    final db = await database;
    final maps = await db.query('tournaments', orderBy: 'created_at DESC');
    return maps.map((row) {
      final teams =
          (jsonDecode(row['teams_json'] as String? ?? '[]') as List<dynamic>)
              .map((t) => Team.fromJson(t as Map<String, dynamic>))
              .toList();
      final matchIds =
          (jsonDecode(row['match_ids_json'] as String? ?? '[]') as List<dynamic>)
              .map((e) => e as String)
              .toList();
      return Tournament(
        id: row['id'] as String,
        name: row['name'] as String,
        defaultRules: MatchRules.fromJson(
            jsonDecode(row['default_rules_json'] as String)
                as Map<String, dynamic>),
        teams: teams,
        matchIds: matchIds,
        status: TournamentStatus.values[row['status'] as int],
        createdAt: DateTime.parse(row['created_at'] as String),
      );
    }).toList();
  }
}
