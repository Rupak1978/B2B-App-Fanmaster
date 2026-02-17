import '../utils/enums.dart';
import 'ball_event.dart';
import 'innings.dart';
import 'match_rules.dart';
import 'team.dart';

class CricketMatch {
  final String id;
  final String? tournamentId;
  final Team team1;
  final Team team2;
  final MatchRules rules;
  MatchStatus status;
  TossDecision? tossDecision;
  String? tossWinnerId;
  Innings? innings1;
  Innings? innings2;
  MatchResult? result;
  String? resultDescription;
  final DateTime createdAt;
  DateTime? startedAt;
  DateTime? completedAt;
  final List<PenaltyEvent> penalties;

  CricketMatch({
    required this.id,
    this.tournamentId,
    required this.team1,
    required this.team2,
    required this.rules,
    this.status = MatchStatus.notStarted,
    this.tossDecision,
    this.tossWinnerId,
    this.innings1,
    this.innings2,
    this.result,
    this.resultDescription,
    required this.createdAt,
    this.startedAt,
    this.completedAt,
    List<PenaltyEvent>? penalties,
  }) : penalties = penalties ?? [];

  Innings? get currentInnings {
    if (innings2 != null && innings2!.status == InningsStatus.inProgress) {
      return innings2;
    }
    if (innings1 != null && innings1!.status == InningsStatus.inProgress) {
      return innings1;
    }
    return null;
  }

  bool get isFirstInnings => currentInnings == innings1;
  bool get isSecondInnings => currentInnings == innings2;

  Team get battingTeam {
    final inn = currentInnings;
    if (inn == null) return team1;
    return inn.battingTeamId == team1.id ? team1 : team2;
  }

  Team get bowlingTeam {
    final inn = currentInnings;
    if (inn == null) return team2;
    return inn.bowlingTeamId == team1.id ? team1 : team2;
  }

  int get penaltyRunsForTeam1 {
    int runs = 0;
    for (final p in penalties) {
      if (p.teamId == team1.id) runs += p.runs;
    }
    return runs;
  }

  int get penaltyRunsForTeam2 {
    int runs = 0;
    for (final p in penalties) {
      if (p.teamId == team2.id) runs += p.runs;
    }
    return runs;
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'tournamentId': tournamentId,
        'team1': team1.toJson(),
        'team2': team2.toJson(),
        'rules': rules.toJson(),
        'status': status.index,
        'tossDecision': tossDecision?.index,
        'tossWinnerId': tossWinnerId,
        'result': result?.index,
        'resultDescription': resultDescription,
        'createdAt': createdAt.toIso8601String(),
        'startedAt': startedAt?.toIso8601String(),
        'completedAt': completedAt?.toIso8601String(),
      };

  factory CricketMatch.fromJson(Map<String, dynamic> json) => CricketMatch(
        id: json['id'] as String,
        tournamentId: json['tournamentId'] as String?,
        team1: Team.fromJson(json['team1'] as Map<String, dynamic>),
        team2: Team.fromJson(json['team2'] as Map<String, dynamic>),
        rules: MatchRules.fromJson(json['rules'] as Map<String, dynamic>),
        status: MatchStatus.values[json['status'] as int? ?? 0],
        tossDecision: json['tossDecision'] != null
            ? TossDecision.values[json['tossDecision'] as int]
            : null,
        tossWinnerId: json['tossWinnerId'] as String?,
        result: json['result'] != null
            ? MatchResult.values[json['result'] as int]
            : null,
        resultDescription: json['resultDescription'] as String?,
        createdAt: DateTime.parse(json['createdAt'] as String),
        startedAt: json['startedAt'] != null
            ? DateTime.parse(json['startedAt'] as String)
            : null,
        completedAt: json['completedAt'] != null
            ? DateTime.parse(json['completedAt'] as String)
            : null,
      );
}
