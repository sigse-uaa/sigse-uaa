import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:sigse/app.dart';
import 'package:sigse/core/storage/storage_keys.dart';
import 'package:sigse/features/auth/presentation/login_page.dart';
import 'package:sigse/features/auth/presentation/register_page.dart';
import 'package:sigse/features/auth/state/auth_provider.dart';
import 'package:sigse/features/shell/presentation/app_shell.dart';

import 'support/fakes.dart';

void main() {
  testWidgets('sin sesión muestra el login', (tester) async {
    final storage = await fakeStorage();
    final api = fakeApi((_) async => jsonResponse(statsBody()));

    await tester.pumpWidget(SigseApp(storage: storage, apiClient: api));
    await tester.pumpAndSettle();

    expect(find.byType(LoginPage), findsOneWidget);
    expect(find.text('SIGSE'), findsOneWidget);
  });

  testWidgets('con sesión guardada entra directo y muestra los conteos', (
    tester,
  ) async {
    final storage = await fakeStorage(savedSession());
    final api = fakeApi((_) async => jsonResponse(statsBody(total: 4)));

    await tester.pumpWidget(SigseApp(storage: storage, apiClient: api));
    await tester.pumpAndSettle();

    expect(find.byType(AppShell), findsOneWidget);
    expect(find.text('Hola, Usuario Demo'), findsOneWidget);
    expect(find.text('Total'), findsOneWidget);
    // El usuario general no ve "Asignadas a mí": es solo del operador.
    expect(find.text('Asignadas a mí'), findsNothing);
  });

  testWidgets('token vencido regresa al login con mensaje', (tester) async {
    final storage = await fakeStorage(savedSession());
    final api = fakeApi(
      (_) async => errorResponse(
        401,
        'INVALID_TOKEN',
        'Tu sesión expiró o no es válida.',
      ),
    );

    await tester.pumpWidget(SigseApp(storage: storage, apiClient: api));
    await tester.pumpAndSettle();

    expect(find.byType(LoginPage), findsOneWidget);
    expect(find.text(AuthProvider.sessionExpiredMessage), findsOneWidget);
    expect(storage.readString(StorageKeys.token), isNull);
  });

  testWidgets('iniciar y cerrar sesión', (tester) async {
    final storage = await fakeStorage();
    final api = fakeApi((request) async {
      if (request.url.path.endsWith('/auth/login')) {
        return jsonResponse({'token': 'jwt', 'user': demoOperator.toJson()});
      }
      return jsonResponse(statsBody(total: 2, pendingAssignedToMe: 1));
    });

    await tester.pumpWidget(SigseApp(storage: storage, apiClient: api));
    await tester.pumpAndSettle();

    await tester.enterText(
      find.widgetWithText(TextFormField, 'Correo'),
      'operador1@example.com',
    );
    await tester.enterText(
      find.widgetWithText(TextFormField, 'Contraseña'),
      'SigseDemo2026!',
    );
    await tester.tap(find.text('Iniciar sesión'));
    await tester.pumpAndSettle();

    expect(find.byType(AppShell), findsOneWidget);
    expect(find.text('Asignadas a mí'), findsOneWidget);

    await tester.tap(find.byTooltip('Cerrar sesión'));
    await tester.pumpAndSettle();

    expect(find.byType(LoginPage), findsOneWidget);
    expect(storage.readString(StorageKeys.token), isNull);
  });

  testWidgets('un 422 del login se muestra junto al campo', (tester) async {
    final storage = await fakeStorage();
    final api = fakeApi(
      (_) async => errorResponse(
        422,
        'VALIDATION_ERROR',
        'Revisa los datos enviados.',
        details: [
          {'path': 'email', 'message': 'Correo rechazado por el servidor'},
        ],
      ),
    );

    await tester.pumpWidget(SigseApp(storage: storage, apiClient: api));
    await tester.pumpAndSettle();
    final email = find.widgetWithText(TextFormField, 'Correo');
    await tester.enterText(email, 'ana@uaa.mx');
    await tester.enterText(
      find.widgetWithText(TextFormField, 'Contraseña'),
      'Secreta123',
    );
    await tester.tap(find.text('Iniciar sesión'));
    await tester.pumpAndSettle();

    // Junto al campo y no repetido en el aviso general.
    expect(find.text('Correo rechazado por el servidor'), findsOneWidget);
    expect(find.text('Revisa los datos enviados.'), findsNothing);

    // Al corregir el campo el mensaje del servidor desaparece.
    await tester.enterText(email, 'ana2@uaa.mx');
    await tester.pumpAndSettle();
    expect(find.text('Correo rechazado por el servidor'), findsNothing);
  });

  testWidgets('al registrarse se cierra la pantalla de registro', (
    tester,
  ) async {
    final storage = await fakeStorage();
    final api = fakeApi((request) async {
      if (request.url.path.endsWith('/auth/register')) {
        return jsonResponse({'token': 'jwt', 'user': demoUser.toJson()}, 201);
      }
      return jsonResponse(statsBody());
    });

    await tester.pumpWidget(SigseApp(storage: storage, apiClient: api));
    await tester.pumpAndSettle();
    await tester.tap(find.text('¿No tienes cuenta? Regístrate'));
    await tester.pumpAndSettle();
    expect(find.byType(RegisterPage), findsOneWidget);

    await tester.enterText(
      find.widgetWithText(TextFormField, 'Nombre completo'),
      'Usuario Demo',
    );
    await tester.enterText(
      find.widgetWithText(TextFormField, 'Correo'),
      'usuario@example.com',
    );
    await tester.enterText(
      find.widgetWithText(TextFormField, 'Contraseña'),
      'Secreta123',
    );
    await tester.tap(find.widgetWithText(FilledButton, 'Crear cuenta'));
    await tester.pumpAndSettle();

    // Sin el cierre de pantallas apiladas, el registro seguiría encima.
    expect(find.byType(RegisterPage), findsNothing);
    expect(find.byType(AppShell), findsOneWidget);
    expect(find.text('Hola, Usuario Demo'), findsOneWidget);
  });
}
