import 'package:flutter_test/flutter_test.dart';
import 'package:sigse/core/storage/storage_keys.dart';
import 'package:sigse/features/auth/data/session_store.dart';

import '../../../support/fakes.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  test('guarda y recupera token y usuario', () async {
    final store = SessionStore(await fakeStorage());

    await store.save('jwt-demo', demoUser);

    expect(store.readToken(), 'jwt-demo');
    final user = store.readUser()!;
    expect(user.id, demoUser.id);
    expect(user.email, demoUser.email);
    expect(user.role, demoUser.role);
  });

  test('sin sesión guardada devuelve null', () async {
    final store = SessionStore(await fakeStorage());

    expect(store.readToken(), isNull);
    expect(store.readUser(), isNull);
  });

  test('ignora un usuario guardado inválido', () async {
    final store = SessionStore(
      await fakeStorage({StorageKeys.user: '{no-json'}),
    );

    expect(store.readUser(), isNull);
  });

  test('clear borra la sesión y la caché del usuario, no lo demás', () async {
    final storage = await fakeStorage({
      ...savedSession(),
      StorageKeys.inspectionsCache(demoUser.id): '[]',
      StorageKeys.lastSync(demoUser.id): '2026-11-27',
      StorageKeys.inspectionsCache(99): '[]',
      StorageKeys.themeMode: 'dark',
      StorageKeys.categoriesCache: '[]',
    });
    final store = SessionStore(storage);

    await store.clear(userId: demoUser.id);

    expect(store.readToken(), isNull);
    expect(store.readUser(), isNull);
    expect(
      storage.readString(StorageKeys.inspectionsCache(demoUser.id)),
      isNull,
    );
    expect(storage.readString(StorageKeys.lastSync(demoUser.id)), isNull);
    expect(storage.readString(StorageKeys.inspectionsCache(99)), '[]');
    expect(storage.readString(StorageKeys.themeMode), 'dark');
    expect(storage.readString(StorageKeys.categoriesCache), '[]');
  });
}
