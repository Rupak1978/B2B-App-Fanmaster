import '../models/ball_event.dart';
import '../models/innings.dart';
import '../models/match.dart';
import '../models/tournament.dart';
import '../utils/enums.dart';

/// Batting stats for a single player in an innings.
class BattingStats {
  final String playerId;
  final String playerName;
  int runs;
  int ballsFaced;
  int fours;
  int sixes;
  bool isOut;
  WicketType? dismissalType;
  String? dismissalDescription;
  bool isOnStrike;

  BattingStats({
    required this.playerId,
    required this.playerName,
    this.runs = 0,
    this.ballsFaced = 0,
    this.fours = 0,
    this.sixes = 0,
    this.isOut = false,
    this.dismissalType,
    this.dismissalDescription,
    this.isOnStrike = false,
  });

  double get strikeRate {
    if (ballsFaced == 0) return 0.0;
    return (runs / ballsFaced) * 100;
  }
}

/// Bowling stats for a single player in an innings.
class BowlingStats {
  final String playerId;
  final String playerName;
  int overs; // completed overs
  int ballsInCurrentOver;
  int runsConceded;
  int wickets;
  int maidens;
  int wides;
  int noBalls;

  BowlingStats({
    required this.playerId,
    required this.playerName,
    this.overs = 0,
    this.ballsInCurrentOver = 0,
    this.runsConceded = 0,
    this.wickets = 0,
    this.maidens = 0,
    this.wides = 0,
    this.noBalls = 0,
  });

  String get oversDisplay => '$overs.$ballsInCurrentOver';

  double get economy {
    final totalBalls = overs * 6 + ballsInCurrentOver;
    if (totalBalls == 0) return 0.0;
    return (runsConceded / totalBalls) * 6;
  }
}

/// Partnership data between two batsmen.
class Partnership {
  final String batsman1Id;
  final String batsman1Name;
  final String batsman2Id;
  final String batsman2Name;
  int totalRuns;
  int totalBalls;
  int batsman1Runs;
  int batsman2Runs;

  Partnership({
    required this.batsman1Id,
    required this.batsman1Name,
    required this.batsman2Id,
    required this.batsman2Name,
    this.totalRuns = 0,
    this.totalBalls = 0,
    this.batsman1Runs = 0,
    this.batsman2Runs = 0,
  });
}

/// Fall of wicket record.
class FallOfWicket {
  final int wicketNumber;
  final int runs;
  final String oversDisplay;
  final String dismissedPlayerName;

  const FallOfWicket({
    required this.wicketNumber,
    required this.runs,
    required this.oversDisplay,
    required this.dismissedPlayerName,
  });
}

class StatsCalculator {
  /// Calculate batting stats for all batsmen in an innings.
  static Map<String, BattingStats> calculateBattingStats(
    Innings innings,
    Map<String, String> playerNames,
  ) {
    final stats = <String, BattingStats>{};

    for (final ball in innings.ballEvents) {
      // Initialize striker stats
      if (!stats.containsKey(ball.strikerId)) {
        stats[ball.strikerId] = BattingStats(
          playerId: ball.strikerId,
          playerName: playerNames[ball.strikerId] ?? 'Unknown',
        );
      }
      // Initialize non-striker stats
      if (!stats.containsKey(ball.nonStrikerId)) {
        stats[ball.nonStrikerId] = BattingStats(
          playerId: ball.nonStrikerId,
          playerName: playerNames[ball.nonStrikerId] ?? 'Unknown',
        );
      }

      final strikerStats = stats[ball.strikerId]!;

      // Count balls faced (wides don't count as balls faced)
      if (ball.extraType != ExtraType.wide) {
        strikerStats.ballsFaced++;
      }

      // Add runs off bat
      if (ball.isPowerBall) {
        strikerStats.runs += ball.runsOffBat * ball.powerBallMultiplier;
      } else {
        strikerStats.runs += ball.runsOffBat;
      }

      // Count boundaries
      if (ball.boundaryType == BoundaryType.four) strikerStats.fours++;
      if (ball.boundaryType == BoundaryType.six) strikerStats.sixes++;

      // Track dismissals
      if (ball.isWicket && ball.dismissedPlayerId != null) {
        final dismissedStats = stats[ball.dismissedPlayerId];
        if (dismissedStats != null &&
            ball.wicketType != WicketType.retiredHurt) {
          dismissedStats.isOut = true;
          dismissedStats.dismissalType = ball.wicketType;
          dismissedStats.dismissalDescription =
              _describeDismissal(ball);
        }
      }
    }

    return stats;
  }

  /// Calculate bowling stats for all bowlers in an innings.
  static Map<String, BowlingStats> calculateBowlingStats(
    Innings innings,
    Map<String, String> playerNames,
  ) {
    final stats = <String, BowlingStats>{};

    for (final ball in innings.ballEvents) {
      if (!stats.containsKey(ball.bowlerId)) {
        stats[ball.bowlerId] = BowlingStats(
          playerId: ball.bowlerId,
          playerName: playerNames[ball.bowlerId] ?? 'Unknown',
        );
      }

      final bowlerStats = stats[ball.bowlerId]!;
      bowlerStats.runsConceded += ball.totalRuns;

      if (ball.isLegal) {
        bowlerStats.ballsInCurrentOver++;
        if (bowlerStats.ballsInCurrentOver == 6) {
          bowlerStats.overs++;
          bowlerStats.ballsInCurrentOver = 0;
        }
      }

      if (ball.extraType == ExtraType.wide) bowlerStats.wides++;
      if (ball.extraType == ExtraType.noBall) bowlerStats.noBalls++;

      if (ball.isWicket &&
          ball.wicketType != WicketType.retiredHurt &&
          ball.wicketType != WicketType.runOut) {
        bowlerStats.wickets++;
      }
    }

    return stats;
  }

  /// Calculate partnerships for an innings.
  static List<Partnership> calculatePartnerships(
    Innings innings,
    Map<String, String> playerNames,
  ) {
    final partnerships = <Partnership>[];
    if (innings.ballEvents.isEmpty) return partnerships;

    String currentBat1 = innings.ballEvents.first.strikerId;
    String currentBat2 = innings.ballEvents.first.nonStrikerId;
    var current = Partnership(
      batsman1Id: currentBat1,
      batsman1Name: playerNames[currentBat1] ?? 'Unknown',
      batsman2Id: currentBat2,
      batsman2Name: playerNames[currentBat2] ?? 'Unknown',
    );

    for (final ball in innings.ballEvents) {
      current.totalRuns += ball.totalRuns;
      if (ball.isLegal) current.totalBalls++;

      if (ball.strikerId == current.batsman1Id) {
        current.batsman1Runs += ball.runsOffBat;
      } else {
        current.batsman2Runs += ball.runsOffBat;
      }

      // New partnership on wicket
      if (ball.isWicket && ball.wicketType != WicketType.retiredHurt) {
        partnerships.add(current);

        // Determine new batsman (will be set by the next ball event)
        final nextBalls = innings.ballEvents
            .where((b) => b.timestamp.isAfter(ball.timestamp))
            .toList();
        if (nextBalls.isNotEmpty) {
          final nextBall = nextBalls.first;
          currentBat1 = nextBall.strikerId;
          currentBat2 = nextBall.nonStrikerId;
          current = Partnership(
            batsman1Id: currentBat1,
            batsman1Name: playerNames[currentBat1] ?? 'Unknown',
            batsman2Id: currentBat2,
            batsman2Name: playerNames[currentBat2] ?? 'Unknown',
          );
        }
      }
    }

    // Add the last (unbroken) partnership
    if (current.totalBalls > 0) {
      partnerships.add(current);
    }

    return partnerships;
  }

  /// Calculate fall of wickets.
  static List<FallOfWicket> calculateFallOfWickets(
    Innings innings,
    Map<String, String> playerNames,
  ) {
    final fow = <FallOfWicket>[];
    int runningTotal = 0;
    int wicketCount = 0;
    int legalBalls = 0;

    for (final ball in innings.ballEvents) {
      runningTotal += ball.totalRuns;
      if (ball.isLegal) legalBalls++;

      if (ball.isWicket && ball.wicketType != WicketType.retiredHurt) {
        wicketCount++;
        final overs = legalBalls ~/ 6;
        final balls = legalBalls % 6;
        fow.add(FallOfWicket(
          wicketNumber: wicketCount,
          runs: runningTotal,
          oversDisplay: '$overs.$balls',
          dismissedPlayerName:
              playerNames[ball.dismissedPlayerId] ?? 'Unknown',
        ));
      }
    }

    return fow;
  }

  /// Calculate tournament standings.
  static List<TeamStanding> calculateStandings(
    List<CricketMatch> matches,
    List<String> teamIds,
    Map<String, String> teamNames,
    int totalOversPerInnings,
  ) {
    final standings = <String, TeamStanding>{};

    // Initialize standings for all teams
    for (final teamId in teamIds) {
      standings[teamId] = TeamStanding(
        team: _makeTeam(teamId, teamNames[teamId] ?? 'Unknown'),
      );
    }

    for (final match in matches) {
      if (match.status != MatchStatus.completed) continue;
      if (match.result == null) continue;

      final t1Id = match.team1.id;
      final t2Id = match.team2.id;
      final s1 = standings[t1Id];
      final s2 = standings[t2Id];
      if (s1 == null || s2 == null) continue;

      s1.played++;
      s2.played++;

      // NRR calculations
      if (match.innings1 != null) {
        final inn1 = match.innings1!;
        final overs1 = _effectiveOvers(inn1, totalOversPerInnings);
        if (inn1.battingTeamId == t1Id) {
          s1.totalRunsScored += inn1.totalRuns;
          s1.totalOversFaced += overs1;
          s2.totalRunsConceded += inn1.totalRuns;
          s2.totalOversBowled += overs1;
        } else {
          s2.totalRunsScored += inn1.totalRuns;
          s2.totalOversFaced += overs1;
          s1.totalRunsConceded += inn1.totalRuns;
          s1.totalOversBowled += overs1;
        }
      }

      if (match.innings2 != null) {
        final inn2 = match.innings2!;
        final overs2 = _effectiveOvers(inn2, totalOversPerInnings);
        if (inn2.battingTeamId == t1Id) {
          s1.totalRunsScored += inn2.totalRuns;
          s1.totalOversFaced += overs2;
          s2.totalRunsConceded += inn2.totalRuns;
          s2.totalOversBowled += overs2;
        } else {
          s2.totalRunsScored += inn2.totalRuns;
          s2.totalOversFaced += overs2;
          s1.totalRunsConceded += inn2.totalRuns;
          s1.totalOversBowled += overs2;
        }
      }

      // Points
      switch (match.result!) {
        case MatchResult.team1Won:
          s1.won++;
          s1.points += 2;
          s2.lost++;
          break;
        case MatchResult.team2Won:
          s2.won++;
          s2.points += 2;
          s1.lost++;
          break;
        case MatchResult.tie:
          s1.tied++;
          s2.tied++;
          s1.points += 1;
          s2.points += 1;
          break;
        case MatchResult.noResult:
          break;
      }
    }

    // Calculate NRR and sort
    final list = standings.values.toList();
    for (final s in list) {
      s.calculateNRR();
    }
    list.sort((a, b) {
      final pointsCmp = b.points.compareTo(a.points);
      if (pointsCmp != 0) return pointsCmp;
      return b.nrr.compareTo(a.nrr);
    });

    return list;
  }

  /// NRR: if all-out, use full quota overs.
  static double _effectiveOvers(Innings innings, int totalOvers) {
    final maxWickets = 10; // typical, but could be adjusted
    if (innings.wickets >= maxWickets - 1) {
      return totalOvers.toDouble();
    }
    return innings.oversAsDecimal;
  }

  static _makeTeam(String id, String name) {
    return __SimpleTeam(id: id, name: name);
  }

  static String _describeDismissal(BallEvent ball) {
    switch (ball.wicketType) {
      case WicketType.bowled:
        return 'b ${ball.bowlerId}';
      case WicketType.caught:
        return 'c ${ball.fielderName ?? "?"} b ${ball.bowlerId}';
      case WicketType.lbw:
        return 'lbw b ${ball.bowlerId}';
      case WicketType.runOut:
        return 'run out (${ball.fielderName ?? "?"})';
      case WicketType.stumped:
        return 'st ${ball.fielderName ?? "?"} b ${ball.bowlerId}';
      case WicketType.hitWicket:
        return 'hit wicket b ${ball.bowlerId}';
      case WicketType.retiredHurt:
        return 'retired hurt';
      default:
        return '';
    }
  }
}

/// Minimal team for standings (avoids circular dependency).
class __SimpleTeam {
  final String id;
  final String name;
  const __SimpleTeam({required this.id, required this.name});
}
