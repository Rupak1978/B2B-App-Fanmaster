/// All enumerations used across the CricLive app.

enum MatchStatus {
  notStarted,
  inProgress,
  completed,
  abandoned,
}

enum InningsStatus {
  notStarted,
  inProgress,
  completed,
}

enum ExtraType {
  none,
  wide,
  noBall,
  bye,
  legBye,
}

enum WicketType {
  bowled,
  caught,
  lbw,
  runOut,
  stumped,
  hitWicket,
  retiredHurt,
}

enum TossDecision {
  bat,
  bowl,
}

enum MatchResult {
  team1Won,
  team2Won,
  tie,
  noResult,
}

enum DeliveryType {
  legal,
  wide,
  noBall,
}

enum BoundaryType {
  none,
  four,
  six,
}

enum TournamentStatus {
  upcoming,
  inProgress,
  completed,
}
