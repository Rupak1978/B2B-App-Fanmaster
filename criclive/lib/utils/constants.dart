import 'package:flutter/material.dart';

class AppColors {
  static const Color primary = Color(0xFF1B5E20);
  static const Color primaryLight = Color(0xFF4CAF50);
  static const Color primaryDark = Color(0xFF0D3B0F);
  static const Color accent = Color(0xFFFF6F00);
  static const Color powerBall = Color(0xFFD50000);
  static const Color powerBallGlow = Color(0xFFFF5252);
  static const Color scoreBackground = Color(0xFF1A1A2E);
  static const Color inputBackground = Color(0xFFF5F5F5);
  static const Color wicket = Color(0xFFD32F2F);
  static const Color boundary = Color(0xFF1565C0);
  static const Color six = Color(0xFF6A1B9A);
  static const Color dot = Color(0xFF757575);
  static const Color wide = Color(0xFFF57F17);
  static const Color noBall = Color(0xFFE65100);
  static const Color white = Colors.white;
  static const Color textPrimary = Color(0xFF212121);
  static const Color textSecondary = Color(0xFF757575);
}

class AppSizes {
  static const double scoringButtonSize = 64.0;
  static const double scoringButtonRadius = 16.0;
  static const double padding = 16.0;
  static const double paddingSmall = 8.0;
  static const double paddingLarge = 24.0;
  static const double scoreFontSize = 48.0;
  static const double oversFontSize = 20.0;
  static const double playerFontSize = 16.0;
  static const double ballSymbolSize = 32.0;
}

class AppStrings {
  static const String appName = 'CricLive';
  static const String tagline = 'Live Scoring & Stats';
  static const String powerBallActive = 'POWER BALL';
  static const String undoLastBall = 'Undo';
  static const String extras = 'Extras';
  static const String wicketLabel = 'Wicket';
  static const String powerBallToggle = 'Power Ball';
}

class MatchDefaults {
  static const int oversPerInnings = 10;
  static const int playersPerTeam = 11;
  static const bool wideExtraBall = true;
  static const bool noBallExtraBall = true;
  static const int powerBallWicketDeduction = 5;
  static const int pointsForWin = 2;
  static const int pointsForTie = 1;
  static const int pointsForLoss = 0;
}
