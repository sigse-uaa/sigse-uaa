import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:sigse/app.dart';

void main() {
  testWidgets('la app muestra el nombre SIGSE', (tester) async {
    await tester.pumpWidget(const SigseApp());

    expect(find.text('SIGSE'), findsWidgets);
    expect(find.byIcon(Icons.signpost_outlined), findsOneWidget);
  });
}
