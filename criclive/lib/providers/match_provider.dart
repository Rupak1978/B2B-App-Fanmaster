import 'package:flutter/foundation.dart';
import 'package:uuid/uuid.dart';
import '../database/database_helper.dart';
import '../models/match.dart';
import '../models/match_rules.dart';
import '../models/player.dart';
import '../models/team.dart';
import '../utils/enums.dart';

/// Manages match creation, listing, and setup.
class MatchProvider extends ChangeNotifier {
  final DatabaseHelper _db = DatabaseHelper();
  final _uuid = const Uuid();

  List<CricketMatch> _matches = [];
  List<CricketMatch> get matches => List.unmodifiable(_matches);

  List<Team> _teams = [];
  List<Team> get teams => List.unmodifiable(_teams);

  Future<void> loadMatches() async {
    _matches = await _db.getAllMatches();
    notifyListeners();
  }

  Future<void> loadTeams() async {
    _teams = await _db.getAllTeams();
    notifyListeners();
  }

  /// Create a new team with players.
  Future<Team> createTeam({
    required String name,
    String? shortName,
    required List<String> playerNames,
  }) async {
    final teamId = _uuid.v4();
    final players = playerNames.map((pName) {
      return Player(
        id: _uuid.v4(),
        name: pName,
        teamId: teamId,
      );
    }).toList();

    final team = Team(
      id: teamId,
      name: name,
      shortName: shortName,
      players: players,
    );

    await _db.insertTeam(team);
    _teams.add(team);
    notifyListeners();
    return team;
  }

  /// Create a new match.
  Future<CricketMatch> createMatch({
    required Team team1,
    required Team team2,
    required MatchRules rules,
    String? tournamentId,
  }) async {
    final match = CricketMatch(
      id: _uuid.v4(),
      tournamentId: tournamentId,
      team1: team1,
      team2: team2,
      rules: rules,
      createdAt: DateTime.now(),
    );

    await _db.insertMatch(match);
    _matches.insert(0, match);
    notifyListeners();
    return match;
  }

  /// Record toss result.
  Future<void> recordToss({
    required String matchId,
    required String tossWinnerId,
    required TossDecision decision,
  }) async {
    final idx = _matches.indexWhere((m) => m.id == matchId);
    if (idx == -1) return;

    _matches[idx].tossWinnerId = tossWinnerId;
    _matches[idx].tossDecision = decision;
    notifyListeners();
  }
}
