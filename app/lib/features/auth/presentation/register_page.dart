import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../state/auth_provider.dart';
import 'auth_error_banner.dart';
import 'auth_validators.dart';

class RegisterPage extends StatefulWidget {
  const RegisterPage({super.key});

  @override
  State<RegisterPage> createState() => _RegisterPageState();
}

class _RegisterPageState extends State<RegisterPage> {
  final _formKey = GlobalKey<FormState>();
  final _name = TextEditingController();
  final _email = TextEditingController();
  final _password = TextEditingController();
  bool _obscurePassword = true;

  @override
  void dispose() {
    _name.dispose();
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
    // Si sale bien, app.dart cierra esta pantalla y muestra la principal.
    await context.read<AuthProvider>().register(
      _name.text.trim(),
      _email.text.trim(),
      _password.text,
    );
  }

  /// Al editar un campo que el servidor marcó (422 o correo repetido), el
  /// mensaje del servidor se quita para que vuelva a validar el cliente.
  void _clearServerError(String field) {
    final auth = context.read<AuthProvider>();
    if (auth.fieldErrors.containsKey(field)) {
      auth.clearError();
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final loading = auth.isLoading;
    final fieldErrors = auth.fieldErrors;
    // Si el error ya se muestra junto a un campo, no se repite arriba.
    final generalError = fieldErrors.isEmpty ? auth.errorMessage : null;

    return Scaffold(
      appBar: AppBar(title: const Text('Crear cuenta')),
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
                      TextFormField(
                        controller: _name,
                        autofillHints: const [AutofillHints.name],
                        textCapitalization: TextCapitalization.words,
                        textInputAction: TextInputAction.next,
                        onChanged: (_) => _clearServerError('name'),
                        forceErrorText: fieldErrors['name'],
                        decoration: const InputDecoration(
                          labelText: 'Nombre completo',
                          prefixIcon: Icon(Icons.person_outline),
                        ),
                        validator: AuthValidators.name,
                      ),
                      const SizedBox(height: 16),
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
                        autofillHints: const [AutofillHints.newPassword],
                        textInputAction: TextInputAction.done,
                        onChanged: (_) => _clearServerError('password'),
                        onFieldSubmitted: (_) => _submit(),
                        forceErrorText: fieldErrors['password'],
                        decoration: InputDecoration(
                          labelText: 'Contraseña',
                          helperText: 'Mínimo 8 caracteres, con al menos una letra y un número',
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
                        validator: AuthValidators.newPassword,
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
                            : const Text('Crear cuenta'),
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
