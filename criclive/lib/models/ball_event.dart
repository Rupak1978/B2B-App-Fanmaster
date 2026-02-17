import '../utils/enums.dart';

/// The single source of truth for all match data.
/// Every delivery is stored as a BallEvent. All stats are derived from these.
class BallEvent {
  final String id;
  final String matchId;
  final String inningsId;
  final int overNumber; // 0-indexed
  final int ballNumber; // 1-indexed within the over (including illegals for tracking)
  final int legalBallNumber; // actual legal ball count in this over (1-6)
  final bool isLegal;
  final String strikerId;
  final String nonStrikerId;
  final String bowlerId;
  final int runsOffBat;
  final int extraRuns;
  final ExtraType extraType;
  final int totalRuns; // final runs added to score (after power ball multiplier)
  final BoundaryType boundaryType;
  final bool isWicket;
  final WicketType? wicketType;
  final String? fielderName; // for caught / run-out
  final String? dismissedPlayerId;
  final bool isPowerBall;
  final int powerBallMultiplier; // 1 if not power ball, 2 if power ball
  final bool powerBallWicketDeductionApplied;
  final int powerBallDeductionAmount;
  final DateTime timestamp;

  const BallEvent({
    required this.id,
    required this.matchId,
    required this.inningsId,
    required this.overNumber,
    required this.ballNumber,
    required this.legalBallNumber,
    required this.isLegal,
    required this.strikerId,
    required this.nonStrikerId,
    required this.bowlerId,
    required this.runsOffBat,
    this.extraRuns = 0,
    this.extraType = ExtraType.none,
    required this.totalRuns,
    this.boundaryType = BoundaryType.none,
    this.isWicket = false,
    this.wicketType,
    this.fielderName,
    this.dismissedPlayerId,
    this.isPowerBall = false,
    this.powerBallMultiplier = 1,
    this.powerBallWicketDeductionApplied = false,
    this.powerBallDeductionAmount = 0,
    required this.timestamp,
  });

  /// Calculate total runs for this delivery including power ball logic.
  static int calculateTotalRuns({
    required int runsOffBat,
    required int extraRuns,
    required bool isPowerBall,
    required bool isWicket,
    required int powerBallWicketDeduction,
  }) {
    int base = runsOffBat + extraRuns;
    if (isPowerBall) {
      base = base * 2; // Double ALL runs
      if (isWicket) {
        base -= powerBallWicketDeduction; // Deduct after doubling
      }
    }
    return base < 0 ? 0 : base; // Never negative
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'matchId': matchId,
        'inningsId': inningsId,
        'overNumber': overNumber,
        'ballNumber': ballNumber,
        'legalBallNumber': legalBallNumber,
        'isLegal': isLegal ? 1 : 0,
        'strikerId': strikerId,
        'nonStrikerId': nonStrikerId,
        'bowlerId': bowlerId,
        'runsOffBat': runsOffBat,
        'extraRuns': extraRuns,
        'extraType': extraType.index,
        'totalRuns': totalRuns,
        'boundaryType': boundaryType.index,
        'isWicket': isWicket ? 1 : 0,
        'wicketType': wicketType?.index,
        'fielderName': fielderName,
        'dismissedPlayerId': dismissedPlayerId,
        'isPowerBall': isPowerBall ? 1 : 0,
        'powerBallMultiplier': powerBallMultiplier,
        'powerBallWicketDeductionApplied':
            powerBallWicketDeductionApplied ? 1 : 0,
        'powerBallDeductionAmount': powerBallDeductionAmount,
        'timestamp': timestamp.toIso8601String(),
      };

  factory BallEvent.fromJson(Map<String, dynamic> json) => BallEvent(
        id: json['id'] as String,
        matchId: json['matchId'] as String,
        inningsId: json['inningsId'] as String,
        overNumber: json['overNumber'] as int,
        ballNumber: json['ballNumber'] as int,
        legalBallNumber: json['legalBallNumber'] as int,
        isLegal: (json['isLegal'] as int) == 1,
        strikerId: json['strikerId'] as String,
        nonStrikerId: json['nonStrikerId'] as String,
        bowlerId: json['bowlerId'] as String,
        runsOffBat: json['runsOffBat'] as int,
        extraRuns: json['extraRuns'] as int? ?? 0,
        extraType: ExtraType.values[json['extraType'] as int? ?? 0],
        totalRuns: json['totalRuns'] as int,
        boundaryType: BoundaryType.values[json['boundaryType'] as int? ?? 0],
        isWicket: (json['isWicket'] as int) == 1,
        wicketType: json['wicketType'] != null
            ? WicketType.values[json['wicketType'] as int]
            : null,
        fielderName: json['fielderName'] as String?,
        dismissedPlayerId: json['dismissedPlayerId'] as String?,
        isPowerBall: (json['isPowerBall'] as int? ?? 0) == 1,
        powerBallMultiplier: json['powerBallMultiplier'] as int? ?? 1,
        powerBallWicketDeductionApplied:
            (json['powerBallWicketDeductionApplied'] as int? ?? 0) == 1,
        powerBallDeductionAmount:
            json['powerBallDeductionAmount'] as int? ?? 0,
        timestamp: DateTime.parse(json['timestamp'] as String),
      );

  /// Symbol for ball-by-ball display in the over timeline.
  String get displaySymbol {
    if (isWicket) return 'W';
    if (extraType == ExtraType.wide) return 'Wd${totalRuns > 1 ? "+${totalRuns - 1}" : ""}';
    if (extraType == ExtraType.noBall) return 'Nb';
    if (boundaryType == BoundaryType.six) return '6';
    if (boundaryType == BoundaryType.four) return '4';
    if (extraType == ExtraType.bye) return '${runsOffBat}B';
    if (extraType == ExtraType.legBye) return '${runsOffBat}Lb';
    return '$totalRuns';
  }
}

/// Penalty event separate from ball-by-ball.
class PenaltyEvent {
  final String id;
  final String matchId;
  final String inningsId;
  final String teamId;
  final int runs; // positive = awarded, negative = deducted
  final String reason;
  final DateTime timestamp;

  const PenaltyEvent({
    required this.id,
    required this.matchId,
    required this.inningsId,
    required this.teamId,
    required this.runs,
    required this.reason,
    required this.timestamp,
  });

  Map<String, dynamic> toJson() => {
        'id': id,
        'matchId': matchId,
        'inningsId': inningsId,
        'teamId': teamId,
        'runs': runs,
        'reason': reason,
        'timestamp': timestamp.toIso8601String(),
      };

  factory PenaltyEvent.fromJson(Map<String, dynamic> json) => PenaltyEvent(
        id: json['id'] as String,
        matchId: json['matchId'] as String,
        inningsId: json['inningsId'] as String,
        teamId: json['teamId'] as String,
        runs: json['runs'] as int,
        reason: json['reason'] as String,
        timestamp: DateTime.parse(json['timestamp'] as String),
      );
}
