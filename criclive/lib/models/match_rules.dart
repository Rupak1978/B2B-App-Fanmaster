/// Configurable match rules parsed from voice/text input.
class MatchRules {
  final int oversPerInnings;
  final int playersPerTeam;
  final bool wideExtraBall;
  final bool noBallExtraBall;
  final bool powerBallEnabled;
  final int powerBallStartOver; // 0-indexed: which over power ball is available from
  final int? powerBallEndOver; // null = only last over
  final int maxPowerBallsPerInnings; // -1 = unlimited during allowed overs
  final int powerBallWicketDeduction;
  final bool powerBallDoublesAll; // doubles all runs including extras
  final bool freeHitOnNoBall;

  const MatchRules({
    required this.oversPerInnings,
    this.playersPerTeam = 11,
    this.wideExtraBall = true,
    this.noBallExtraBall = true,
    this.powerBallEnabled = false,
    this.powerBallStartOver = -1, // -1 means last over
    this.powerBallEndOver,
    this.maxPowerBallsPerInnings = -1,
    this.powerBallWicketDeduction = 5,
    this.powerBallDoublesAll = true,
    this.freeHitOnNoBall = false,
  });

  /// The actual 0-indexed over number where power ball becomes available.
  int get effectivePowerBallStartOver {
    if (powerBallStartOver == -1) {
      return oversPerInnings - 1; // last over
    }
    return powerBallStartOver;
  }

  /// Check if power ball can be activated in the given over (0-indexed).
  bool canActivatePowerBall(int currentOver) {
    if (!powerBallEnabled) return false;
    final start = effectivePowerBallStartOver;
    final end = powerBallEndOver ?? (oversPerInnings - 1);
    return currentOver >= start && currentOver <= end;
  }

  Map<String, dynamic> toJson() => {
        'oversPerInnings': oversPerInnings,
        'playersPerTeam': playersPerTeam,
        'wideExtraBall': wideExtraBall,
        'noBallExtraBall': noBallExtraBall,
        'powerBallEnabled': powerBallEnabled,
        'powerBallStartOver': powerBallStartOver,
        'powerBallEndOver': powerBallEndOver,
        'maxPowerBallsPerInnings': maxPowerBallsPerInnings,
        'powerBallWicketDeduction': powerBallWicketDeduction,
        'powerBallDoublesAll': powerBallDoublesAll,
        'freeHitOnNoBall': freeHitOnNoBall,
      };

  factory MatchRules.fromJson(Map<String, dynamic> json) => MatchRules(
        oversPerInnings: json['oversPerInnings'] as int,
        playersPerTeam: json['playersPerTeam'] as int? ?? 11,
        wideExtraBall: json['wideExtraBall'] as bool? ?? true,
        noBallExtraBall: json['noBallExtraBall'] as bool? ?? true,
        powerBallEnabled: json['powerBallEnabled'] as bool? ?? false,
        powerBallStartOver: json['powerBallStartOver'] as int? ?? -1,
        powerBallEndOver: json['powerBallEndOver'] as int?,
        maxPowerBallsPerInnings:
            json['maxPowerBallsPerInnings'] as int? ?? -1,
        powerBallWicketDeduction:
            json['powerBallWicketDeduction'] as int? ?? 5,
        powerBallDoublesAll: json['powerBallDoublesAll'] as bool? ?? true,
        freeHitOnNoBall: json['freeHitOnNoBall'] as bool? ?? false,
      );

  MatchRules copyWith({
    int? oversPerInnings,
    int? playersPerTeam,
    bool? wideExtraBall,
    bool? noBallExtraBall,
    bool? powerBallEnabled,
    int? powerBallStartOver,
    int? powerBallEndOver,
    int? maxPowerBallsPerInnings,
    int? powerBallWicketDeduction,
    bool? powerBallDoublesAll,
    bool? freeHitOnNoBall,
  }) {
    return MatchRules(
      oversPerInnings: oversPerInnings ?? this.oversPerInnings,
      playersPerTeam: playersPerTeam ?? this.playersPerTeam,
      wideExtraBall: wideExtraBall ?? this.wideExtraBall,
      noBallExtraBall: noBallExtraBall ?? this.noBallExtraBall,
      powerBallEnabled: powerBallEnabled ?? this.powerBallEnabled,
      powerBallStartOver: powerBallStartOver ?? this.powerBallStartOver,
      powerBallEndOver: powerBallEndOver ?? this.powerBallEndOver,
      maxPowerBallsPerInnings:
          maxPowerBallsPerInnings ?? this.maxPowerBallsPerInnings,
      powerBallWicketDeduction:
          powerBallWicketDeduction ?? this.powerBallWicketDeduction,
      powerBallDoublesAll: powerBallDoublesAll ?? this.powerBallDoublesAll,
      freeHitOnNoBall: freeHitOnNoBall ?? this.freeHitOnNoBall,
    );
  }
}
