import 'package:flutter/material.dart';

abstract final class AppTheme {
  static const seedColor = Color(0xFF1B5E20);

  static ThemeData get light => ThemeData(
    useMaterial3: true,
    colorScheme: ColorScheme.fromSeed(seedColor: seedColor),
  );
}
