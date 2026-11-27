import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:sigse/app.dart';

import '../../support/fakes.dart';

void main() {
  /// El shell solo se ve con sesión, así que se arranca con una guardada.
  Future<void> pumpShell(WidgetTester tester, Size size) async {
    tester.view.physicalSize = size;
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    final storage = await fakeStorage(savedSession());
    final api = fakeApi((_) async => jsonResponse(statsBody()));

    await tester.pumpWidget(SigseApp(storage: storage, apiClient: api));
    await tester.pumpAndSettle();
  }

  testWidgets('usa NavigationBar en pantallas angostas', (tester) async {
    await pumpShell(tester, const Size(600, 800));

    expect(find.byType(NavigationBar), findsOneWidget);
    expect(find.byType(NavigationRail), findsNothing);
  });

  testWidgets('usa NavigationRail en pantallas anchas', (tester) async {
    await pumpShell(tester, const Size(1000, 800));

    expect(find.byType(NavigationRail), findsOneWidget);
    expect(find.byType(NavigationBar), findsNothing);
  });
}
