import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:sigse/core/storage/local_storage.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() {
    SharedPreferences.setMockInitialValues(<String, Object>{});
  });

  test('guarda y recupera mapas JSON', () async {
    final storage = await LocalStorage.create();
    final value = <String, dynamic>{
      'id': 7,
      'name': 'Inspección',
      'active': true,
    };

    await storage.writeJson('demo', value);

    expect(storage.readJson('demo'), value);
    expect(storage.readMap('demo'), value);
  });

  test('elimina y limpia valores', () async {
    final storage = await LocalStorage.create();
    await storage.writeString('token', 'abc123');
    await storage.writeJson('demo', <String, dynamic>{'id': 1});

    await storage.remove('token');

    expect(storage.readString('token'), isNull);
    expect(storage.readMap('demo'), isNotNull);

    await storage.clear();

    expect(storage.readMap('demo'), isNull);
  });

  test('ignora JSON inválido almacenado', () async {
    SharedPreferences.setMockInitialValues(<String, Object>{
      'broken': '{no-json',
    });
    final storage = await LocalStorage.create();

    expect(storage.readJson('broken'), isNull);
  });
}
