// Wibe Color Palette
import 'package:flutter/material.dart';

class WibeColors {
  // Primary
  static const Color primary = Color(0xFF6C4BF4);
  static const Color primaryLight = Color(0xFF8B5CF6);
  static const Color primaryDark = Color(0xFF5B3BD6);

  // Backgrounds
  static const Color lightBackground = Color(0xFFF8F7FC);
  static const Color lightSurface = Color(0xFFFFFFFF);
  static const Color darkBackground = Color(0xFF0F0F14);
  static const Color darkSurface = Color(0xFF1A1A2E);

  // Status
  static const Color success = Color(0xFF22C55E);
  static const Color error = Color(0xFFEF4444);
  static const Color warning = Color(0xFFF59E0B);
  static const Color info = Color(0xFF3B82F6);

  // Text
  static const Color lightTextPrimary = Color(0xFF1A1A2E);
  static const Color lightTextSecondary = Color(0xFF6B7280);
  static const Color darkTextPrimary = Color(0xFFF8F7FC);
  static const Color darkTextSecondary = Color(0xFF9CA3AF);

  // Borders
  static const Color lightBorder = Color(0xFFE5E7EB);
  static const Color darkBorder = Color(0xFF374151);

  // Chat bubbles
  static const Color lightOutgoingBubble = Color(0xFF6C4BF4);
  static const Color lightIncomingBubble = Color(0xFFE5E7EB);
  static const Color darkOutgoingBubble = Color(0xFF8B5CF6);
  static const Color darkIncomingBubble = Color(0xFF374151);
}

class WibeSpacing {
  static const double xs = 4.0;
  static const double sm = 8.0;
  static const double md = 16.0;
  static const double lg = 24.0;
  static const double xl = 32.0;
  static const double xxl = 48.0;
}

class WibeBorderRadius {
  static const double sm = 8.0;
  static const double md = 12.0;
  static const double lg = 16.0;
  static const double xl = 24.0;
  static const double full = 9999.0;
}

class WibeShadows {
  static const List<BoxShadow> light = [
    BoxShadow(
      color: Color(0x1A000000),
      blurRadius: 8,
      offset: Offset(0, 2),
    ),
  ];

  static const List<BoxShadow> dark = [
    BoxShadow(
      color: Color(0x33000000),
      blurRadius: 8,
      offset: Offset(0, 2),
    ),
  ];
}