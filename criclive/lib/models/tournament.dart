import '../utils/enums.dart';
import 'match_rules.dart';
import 'team.dart';

class Tournament {
  final String id;
  final String name;
  final MatchRules defaultRules;
  final List<Team> teams;
  final List<String> matchIds;
  TournamentStatus status;
  final DateTime createdAt;

  Tournament({
    required this.id,
    required this.name,
    required this.defaultRules,
    List<Team>? teams,
    List<String>? matchIds,
    this.status = TournamentStatus.upcoming,
    required this.createdAt,
  })  : teams = teams ?? [],
        matchIds = matchIds ?? [];

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'defaultRules': defaultRules.toJson(),
        'teams': teams.map((t) => t.toJson()).toList(),
        'matchIds': matchIds,
        'status': status.index,
        'createdAt': createdAt.toIso8601String(),
      };

  factory Tournament.fromJson(Map<String, dynamic> json) => Tournament(
        id: json['id'] as String,
        name: json['name'] as String,
        defaultRules:
            MatchRules.fromJson(json['defaultRules'] as Map<String, dynamic>),
        teams: (json['teams'] as List<dynamic>?)
                ?.map((t) => Team.fromJson(t as Map<String, dynamic>))
                .toList() ??
            [],
        matchIds: (json['matchIds'] as List<dynamic>?)
                ?.map((e) => e as String)
                .toList() ??
            [],
        status: TournamentStatus.values[json['status'] as int? ?? 0],
        createdAt: DateTime.parse(json['createdAt'] as String),
      );
}

class TeamStanding {
  final Team team;
  int played;
  int won;
  int lost;
  int tied;
  int points;
  double nrr;
  int totalRunsScored;
  double totalOversFaced;
  int totalRunsConceded;
  double totalOversBowled;

  TeamStanding({
    required this.team,
    this.played = 0,
    this.won = 0,
    this.lost = 0,
    this.tied = 0,
    this.points = 0,
    this.nrr = 0.0,
    this.totalRunsScored = 0,
    this.totalOversFaced = 0.0,
    this.totalRunsConceded = 0,
    this.totalOversBowled = 0.0,
  });

  void calculateNRR() {
    if (totalOversFaced == 0 || totalOversBowled == 0) {
      nrr = 0.0;
      return;
    }
    final scoringRate = totalRunsScored / totalOversFaced;
    final concedingRate = totalRunsConceded / totalOversBowled;
    nrr = scoringRate - concedingRate;
  }
}
