import 'package:flutter/foundation.dart';
import 'package:uuid/uuid.dart';
import '../database/database_helper.dart';
import '../models/match.dart';
import '../models/match_rules.dart';
import '../models/team.dart';
import '../models/tournament.dart';
import '../services/stats_calculator.dart';
import '../utils/enums.dart';

class TournamentProvider extends ChangeNotifier {
  final DatabaseHelper _db = DatabaseHelper();
  final _uuid = const Uuid();

  List<Tournament> _tournaments = [];
  List<Tournament> get tournaments => List.unmodifiable(_tournaments);

  List<TeamStanding> _standings = [];
  List<TeamStanding> get standings => List.unmodifiable(_standings);

  Future<void> loadTournaments() async {
    _tournaments = await _db.getAllTournaments();
    notifyListeners();
  }

  Future<Tournament> createTournament({
    required String name,
    required MatchRules defaultRules,
    required List<Team> teams,
  }) async {
    final tournament = Tournament(
      id: _uuid.v4(),
      name: name,
      defaultRules: defaultRules,
      teams: teams,
      status: TournamentStatus.upcoming,
      createdAt: DateTime.now(),
    );

    await _db.insertTournament(tournament);
    _tournaments.insert(0, tournament);
    notifyListeners();
    return tournament;
  }

  /// Calculate and update standings for a tournament.
  Future<void> calculateStandings(String tournamentId) async {
    final tournament = _tournaments.firstWhere((t) => t.id == tournamentId);
    final matches = <CricketMatch>[];
    for (final matchId in tournament.matchIds) {
      final match = await _db.getMatch(matchId);
      if (match != null) matches.add(match);
    }

    final teamIds = tournament.teams.map((t) => t.id).toList();
    final teamNames = {
      for (final t in tournament.teams) t.id: t.name,
    };

    _standings = StatsCalculator.calculateStandings(
      matches,
      teamIds,
      teamNames,
      tournament.defaultRules.oversPerInnings,
    );

    notifyListeners();
  }
}
