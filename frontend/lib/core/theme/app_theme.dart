import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../constants/colors.dart';

enum ThemeModeType { system, light, dark }

final themeModeProvider = StateNotifierProvider<ThemeModeNotifier, ThemeModeType>((ref) {
  return ThemeModeNotifier();
});

class ThemeModeNotifier extends StateNotifier<ThemeModeType> {
  ThemeModeNotifier() : super(ThemeModeType.system) {
    _loadThemeMode();
  }

  Future<void> _loadThemeMode() async {
    final prefs = await SharedPreferences.getInstance();
    final mode = prefs.getString('theme_mode') ?? 'system';
    state = ThemeModeType.values.firstWhere(
      (e) => e.name == mode,
      orElse: () => ThemeModeType.system,
    );
  }

  Future<void> setThemeMode(ThemeModeType mode) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('theme_mode', mode.name);
    state = mode;
  }
}

final lightTheme = ThemeData(
  useMaterial3: true,
  brightness: Brightness.light,
  colorScheme: const ColorScheme.light(
    primary: WibeColors.primary,
    primaryContainer: WibeColors.primaryLight,
    secondary: WibeColors.primaryLight,
    surface: WibeColors.lightSurface,
    background: WibeColors.lightBackground,
    error: WibeColors.error,
    onPrimary: Colors.white,
    onSurface: WibeColors.lightTextPrimary,
    onBackground: WibeColors.lightTextPrimary,
    onError: Colors.white,
    outline: WibeColors.lightBorder,
  ),
  scaffoldBackgroundColor: WibeColors.lightBackground,
  appBarTheme: const AppBarTheme(
    backgroundColor: WibeColors.lightSurface,
    foregroundColor: WibeColors.lightTextPrimary,
    elevation: 0,
    centerTitle: true,
    titleTextStyle: TextStyle(
      color: WibeColors.lightTextPrimary,
      fontSize: 18,
      fontWeight: FontWeight.w600,
    ),
  ),
  cardTheme: CardTheme(
    color: WibeColors.lightSurface,
    elevation: 0,
    shape: RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(WibeBorderRadius.md),
      side: const BorderSide(color: WibeColors.lightBorder),
    ),
  ),
  elevatedButtonTheme: ElevatedButtonThemeData(
    style: ElevatedButton.styleFrom(
      backgroundColor: WibeColors.primary,
      foregroundColor: Colors.white,
      elevation: 0,
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(WibeBorderRadius.md),
      ),
      textStyle: const TextStyle(
        fontSize: 16,
        fontWeight: FontWeight.w600,
      ),
    ),
  ),
  outlinedButtonTheme: OutlinedButtonThemeData(
    style: OutlinedButton.styleFrom(
      foregroundColor: WibeColors.primary,
      side: const BorderSide(color: WibeColors.primary, width: 1.5),
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(WibeBorderRadius.md),
      ),
      textStyle: const TextStyle(
        fontSize: 16,
        fontWeight: FontWeight.w600,
      ),
    ),
  ),
  textButtonTheme: TextButtonThemeData(
    style: TextButton.styleFrom(
      foregroundColor: WibeColors.primary,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      textStyle: const TextStyle(
        fontSize: 16,
        fontWeight: FontWeight.w600,
      ),
    ),
  ),
  inputDecorationTheme: InputDecorationTheme(
    filled: true,
    fillColor: WibeColors.lightSurface,
    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
    border: OutlineInputBorder(
      borderRadius: BorderRadius.circular(WibeBorderRadius.md),
      borderSide: const BorderSide(color: WibeColors.lightBorder),
    ),
    enabledBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(WibeBorderRadius.md),
      borderSide: const BorderSide(color: WibeColors.lightBorder),
    ),
    focusedBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(WibeBorderRadius.md),
      borderSide: const BorderSide(color: WibeColors.primary, width: 2),
    ),
    errorBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(WibeBorderRadius.md),
      borderSide: const BorderSide(color: WibeColors.error),
    ),
    labelStyle: const TextStyle(color: WibeColors.lightTextSecondary),
    hintStyle: const TextStyle(color: WibeColors.lightTextSecondary),
  ),
  bottomNavigationBarTheme: const BottomNavigationBarThemeData(
    backgroundColor: WibeColors.lightSurface,
    selectedItemColor: WibeColors.primary,
    unselectedItemColor: WibeColors.lightTextSecondary,
    type: BottomNavigationBarType.fixed,
    elevation: 8,
  ),
  dividerTheme: const DividerThemeData(
    color: WibeColors.lightBorder,
    thickness: 1,
    space: 1,
  ),
  chipTheme: ChipThemeData(
    backgroundColor: WibeColors.lightBackground,
    selectedColor: WibeColors.primary.withOpacity(0.1),
    labelStyle: const TextStyle(color: WibeColors.lightTextPrimary),
    secondaryLabelStyle: const TextStyle(color: WibeColors.primary),
    shape: RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(WibeBorderRadius.full),
      side: const BorderSide(color: WibeColors.lightBorder),
    ),
  ),
  dialogTheme: DialogTheme(
    backgroundColor: WibeColors.lightSurface,
    shape: RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(WibeBorderRadius.lg),
    ),
  ),
  snackBarTheme: SnackBarThemeData(
    backgroundColor: WibeColors.darkSurface,
    contentTextStyle: const TextStyle(color: WibeColors.darkTextPrimary),
    shape: RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(WibeBorderRadius.md),
    ),
    behavior: SnackBarBehavior.floating,
  ),
);

final darkTheme = ThemeData(
  useMaterial3: true,
  brightness: Brightness.dark,
  colorScheme: const ColorScheme.dark(
    primary: WibeColors.primaryLight,
    primaryContainer: WibeColors.primary,
    secondary: WibeColors.primaryLight,
    surface: WibeColors.darkSurface,
    background: WibeColors.darkBackground,
    error: WibeColors.error,
    onPrimary: Colors.white,
    onSurface: WibeColors.darkTextPrimary,
    onBackground: WibeColors.darkTextPrimary,
    onError: Colors.white,
    outline: WibeColors.darkBorder,
  ),
  scaffoldBackgroundColor: WibeColors.darkBackground,
  appBarTheme: const AppBarTheme(
    backgroundColor: WibeColors.darkSurface,
    foregroundColor: WibeColors.darkTextPrimary,
    elevation: 0,
    centerTitle: true,
    titleTextStyle: TextStyle(
      color: WibeColors.darkTextPrimary,
      fontSize: 18,
      fontWeight: FontWeight.w600,
    ),
  ),
  cardTheme: CardTheme(
    color: WibeColors.darkSurface,
    elevation: 0,
    shape: RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(WibeBorderRadius.md),
      side: const BorderSide(color: WibeColors.darkBorder),
    ),
  ),
  elevatedButtonTheme: ElevatedButtonThemeData(
    style: ElevatedButton.styleFrom(
      backgroundColor: WibeColors.primaryLight,
      foregroundColor: Colors.white,
      elevation: 0,
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(WibeBorderRadius.md),
      ),
      textStyle: const TextStyle(
        fontSize: 16,
        fontWeight: FontWeight.w600,
      ),
    ),
  ),
  outlinedButtonTheme: OutlinedButtonThemeData(
    style: OutlinedButton.styleFrom(
      foregroundColor: WibeColors.primaryLight,
      side: const BorderSide(color: WibeColors.primaryLight, width: 1.5),
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(WibeBorderRadius.md),
      ),
      textStyle: const TextStyle(
        fontSize: 16,
        fontWeight: FontWeight.w600,
      ),
    ),
  ),
  textButtonTheme: TextButtonThemeData(
    style: TextButton.styleFrom(
      foregroundColor: WibeColors.primaryLight,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      textStyle: const TextStyle(
        fontSize: 16,
        fontWeight: FontWeight.w600,
      ),
    ),
  ),
  inputDecorationTheme: InputDecorationTheme(
    filled: true,
    fillColor: WibeColors.darkSurface,
    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
    border: OutlineInputBorder(
      borderRadius: BorderRadius.circular(WibeBorderRadius.md),
      borderSide: const BorderSide(color: WibeColors.darkBorder),
    ),
    enabledBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(WibeBorderRadius.md),
      borderSide: const BorderSide(color: WibeColors.darkBorder),
    ),
    focusedBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(WibeBorderRadius.md),
      borderSide: const BorderSide(color: WibeColors.primaryLight, width: 2),
    ),
    errorBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(WibeBorderRadius.md),
      borderSide: const BorderSide(color: WibeColors.error),
    ),
    labelStyle: const TextStyle(color: WibeColors.darkTextSecondary),
    hintStyle: const TextStyle(color: WibeColors.darkTextSecondary),
  ),
  bottomNavigationBarTheme: const BottomNavigationBarThemeData(
    backgroundColor: WibeColors.darkSurface,
    selectedItemColor: WibeColors.primaryLight,
    unselectedItemColor: WibeColors.darkTextSecondary,
    type: BottomNavigationBarType.fixed,
    elevation: 8,
  ),
  dividerTheme: const DividerThemeData(
    color: WibeColors.darkBorder,
    thickness: 1,
    space: 1,
  ),
  chipTheme: ChipThemeData(
    backgroundColor: WibeColors.darkBackground,
    selectedColor: WibeColors.primaryLight.withOpacity(0.1),
    labelStyle: const TextStyle(color: WibeColors.darkTextPrimary),
    secondaryLabelStyle: const TextStyle(color: WibeColors.primaryLight),
    shape: RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(WibeBorderRadius.full),
      side: const BorderSide(color: WibeColors.darkBorder),
    ),
  ),
  dialogTheme: DialogTheme(
    backgroundColor: WibeColors.darkSurface,
    shape: RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(WibeBorderRadius.lg),
    ),
  ),
  snackBarTheme: SnackBarThemeData(
    backgroundColor: WibeColors.lightSurface,
    contentTextStyle: const TextStyle(color: WibeColors.lightTextPrimary),
    shape: RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(WibeBorderRadius.md),
    ),
    behavior: SnackBarBehavior.floating,
  ),
);

ThemeData getTheme(ThemeModeType mode, BuildContext context) {
  switch (mode) {
    case ThemeModeType.light:
      return lightTheme;
    case ThemeModeType.dark:
      return darkTheme;
    case ThemeModeType.system:
      return MediaQuery.of(context).platformBrightness == Brightness.dark
          ? darkTheme
          : lightTheme;
  }
}