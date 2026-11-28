import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../core/navigation/app_routes.dart';
import '../state/auth_provider.dart';
import 'auth_error_banner.dart';
import 'auth_validators.dart';

class LoginPage extends StatefulWidget {
  const LoginPage({super.key});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final _formKey = GlobalKey<FormState>();
  final _email = TextEditingController();
  final _password = TextEditingController();
  bool _obscurePassword = true;

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    // Enter en el último campo también envía: se evita mandar dos veces.
    if (context.read<AuthProvider>().isLoading ||
        !_formKey.currentState!.validate()) {
      return;
    }
    // Si sale bien, la app cambia sola a la pantalla principal (ver app.dart).
    await context.read<AuthProvider>().login(
      _email.text.trim(),
      _password.text,
    );
  }

  /// Igual que en el registro: al editar un campo que el servidor marcó (422),
  /// se quita su mensaje para que vuelva a validar la app.
  void _clearServerError(String field) {
    final auth = context.read<AuthProvider>();
    if (auth.fieldErrors.containsKey(field)) {
      auth.clearError();
    }
  }

  Future<void> _openRegister() async {
    final auth = context.read<AuthProvider>()..clearError();
    await Navigator.of(context).pushNamed(AppRoutes.register);
    auth.clearError();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final auth = context.watch<AuthProvider>();
    final loading = auth.isLoading;
    final fieldErrors = auth.fieldErrors;
    // Si el error ya se muestra junto a un campo, no se repite abajo.
    final generalError = fieldErrors.isEmpty ? auth.errorMessage : null;

    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 420),
              child: Form(
                key: _formKey,
                child: AutofillGroup(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Icon(
                        Icons.signpost_outlined,
                        size: 72,
                        color: theme.colorScheme.primary,
                      ),
                      const SizedBox(height: 12),
                      Text(
                        'SIGSE',
                        textAlign: TextAlign.center,
                        style: theme.textTheme.headlineMedium,
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Inicia sesión para continuar',
                        textAlign: TextAlign.center,
                        style: theme.textTheme.bodyLarge,
                      ),
                      const SizedBox(height: 32),
                      TextFormField(
                        controller: _email,
                        keyboardType: TextInputType.emailAddress,
                        autofillHints: const [AutofillHints.email],
                        textInputAction: TextInputAction.next,
                        onChanged: (_) => _clearServerError('email'),
                        forceErrorText: fieldErrors['email'],
                        decoration: const InputDecoration(
                          labelText: 'Correo',
                          prefixIcon: Icon(Icons.mail_outline),
                        ),
                        validator: AuthValidators.email,
                      ),
                      const SizedBox(height: 16),
                      TextFormField(
                        controller: _password,
                        obscureText: _obscurePassword,
                        autofillHints: const [AutofillHints.password],
                        textInputAction: TextInputAction.done,
                        onChanged: (_) => _clearServerError('password'),
                        onFieldSubmitted: (_) => _submit(),
                        forceErrorText: fieldErrors['password'],
                        decoration: InputDecoration(
                          labelText: 'Contraseña',
                          prefixIcon: const Icon(Icons.lock_outline),
                          suffixIcon: IconButton(
                            tooltip: _obscurePassword
                                ? 'Mostrar contraseña'
                                : 'Ocultar contraseña',
                            icon: Icon(
                              _obscurePassword
                                  ? Icons.visibility_outlined
                                  : Icons.visibility_off_outlined,
                            ),
                            onPressed: () => setState(
                              () => _obscurePassword = !_obscurePassword,
                            ),
                          ),
                        ),
                        validator: AuthValidators.loginPassword,
                      ),
                      if (generalError != null) ...[
                        const SizedBox(height: 16),
                        AuthErrorBanner(message: generalError),
                      ],
                      const SizedBox(height: 24),
                      FilledButton(
                        onPressed: loading ? null : _submit,
                        child: loading
                            ? const SizedBox.square(
                                dimension: 20,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                ),
                              )
                            : const Text('Iniciar sesión'),
                      ),
                      const SizedBox(height: 8),
                      TextButton(
                        onPressed: loading ? null : _openRegister,
                        child: const Text('¿No tienes cuenta? Regístrate'),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
