import '../models/match_rules.dart';

/// Parses voice/text input into structured MatchRules.
///
/// Examples:
/// - "8 overs match, 6 players, power ball allowed in last over"
/// - "10 overs tournament match, wide and no ball extra ball, power ball doubles everything"
/// - "20 overs, 11 players per team"
class RulesParser {
  /// Parse a natural language string into MatchRules.
  static MatchRules parse(String input) {
    final lower = input.toLowerCase().trim();

    int overs = _extractOvers(lower);
    int players = _extractPlayers(lower);
    bool powerBall = _hasPowerBall(lower);
    int powerBallStartOver = -1; // default last over
    bool powerBallDoublesAll = true;
    bool freeHit = _hasFreeHit(lower);

    // Check for specific power ball over rules
    if (powerBall) {
      final specificOver = _extractPowerBallOver(lower, overs);
      if (specificOver != null) {
        powerBallStartOver = specificOver;
      }
      if (lower.contains('doubles everything') ||
          lower.contains('double all') ||
          lower.contains('doubles all')) {
        powerBallDoublesAll = true;
      }
    }

    return MatchRules(
      oversPerInnings: overs,
      playersPerTeam: players,
      wideExtraBall: true, // fixed as per spec
      noBallExtraBall: true, // fixed as per spec
      powerBallEnabled: powerBall,
      powerBallStartOver: powerBallStartOver,
      powerBallWicketDeduction: 5,
      powerBallDoublesAll: powerBallDoublesAll,
      freeHitOnNoBall: freeHit,
    );
  }

  static int _extractOvers(String input) {
    // Match patterns like "8 overs", "10 over", "20-over"
    final patterns = [
      RegExp(r'(\d+)\s*[-]?\s*overs?'),
      RegExp(r'(\d+)\s*ov'),
    ];
    for (final pattern in patterns) {
      final match = pattern.firstMatch(input);
      if (match != null) {
        return int.parse(match.group(1)!);
      }
    }
    return 10; // default
  }

  static int _extractPlayers(String input) {
    // Match "6 players", "11 players per team", "6-a-side"
    final patterns = [
      RegExp(r'(\d+)\s*players?'),
      RegExp(r'(\d+)\s*[-]?\s*a\s*[-]?\s*side'),
      RegExp(r'(\d+)\s*per\s*team'),
    ];
    for (final pattern in patterns) {
      final match = pattern.firstMatch(input);
      if (match != null) {
        return int.parse(match.group(1)!);
      }
    }
    return 11; // default
  }

  static bool _hasPowerBall(String input) {
    return input.contains('power ball') ||
        input.contains('powerball') ||
        input.contains('power-ball');
  }

  static bool _hasFreeHit(String input) {
    return input.contains('free hit') || input.contains('free-hit');
  }

  static int? _extractPowerBallOver(String input, int totalOvers) {
    // "power ball in last over" → totalOvers - 1
    if (input.contains('last over')) {
      return -1; // sentinel for last over
    }
    // "power ball from over 5"
    final fromOver = RegExp(r'power\s*ball.*?(?:from|after)\s*over\s*(\d+)')
        .firstMatch(input);
    if (fromOver != null) {
      return int.parse(fromOver.group(1)!) - 1; // 0-indexed
    }
    // "power ball in over 8"
    final inOver = RegExp(r'power\s*ball.*?in\s*over\s*(\d+)')
        .firstMatch(input);
    if (inOver != null) {
      return int.parse(inOver.group(1)!) - 1;
    }
    return null;
  }

  /// Convert MatchRules back to a human-readable description.
  static String describe(MatchRules rules) {
    final parts = <String>[];
    parts.add('${rules.oversPerInnings} overs per innings');
    parts.add('${rules.playersPerTeam} players per team');
    parts.add('Wide & No-ball = extra ball');

    if (rules.powerBallEnabled) {
      if (rules.powerBallStartOver == -1) {
        parts.add('Power Ball: last over only');
      } else {
        parts.add(
            'Power Ball: from over ${rules.effectivePowerBallStartOver + 1}');
      }
      if (rules.powerBallDoublesAll) {
        parts.add('Power Ball doubles ALL runs');
      }
      parts.add(
          'Power Ball wicket: -${rules.powerBallWicketDeduction} runs');
    }

    if (rules.freeHitOnNoBall) {
      parts.add('Free hit after no-ball');
    }

    return parts.join('\n');
  }
}
