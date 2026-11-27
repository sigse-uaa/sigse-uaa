import 'package:flutter/material.dart';

import 'app.dart';
import 'core/network/api_client.dart';
import 'core/storage/local_storage.dart';

Future<void> main() async {
  // shared_preferences usa canales de plataforma: hay que iniciar Flutter antes.
  WidgetsFlutterBinding.ensureInitialized();
  final storage = await LocalStorage.create();

  runApp(SigseApp(storage: storage, apiClient: ApiClient()));
}
