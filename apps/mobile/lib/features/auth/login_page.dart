import 'package:flutter/material.dart';
import '../../core/api_client.dart';

class LoginPage extends StatefulWidget {
  const LoginPage({required this.apiClient, required this.onAuthenticated, super.key});

  final ApiClient apiClient;
  final VoidCallback onAuthenticated;

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final email = TextEditingController(text: 'agent@example.com');
  final displayName = TextEditingController(text: 'Demo Agent');
  final password = TextEditingController(text: 'StrongPass123!');
  bool registerMode = false;
  bool loading = false;

  Future<void> submit() async {
    setState(() => loading = true);
    try {
      if (registerMode) {
        await widget.apiClient.register(email.text, displayName.text, password.text);
      } else {
        await widget.apiClient.login(email.text, password.text);
      }
      widget.onAuthenticated();
    } finally {
      if (mounted) {
        setState(() => loading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Real Estate')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          SegmentedButton<bool>(
            segments: const [
              ButtonSegment(value: false, label: Text('Login')),
              ButtonSegment(value: true, label: Text('Register')),
            ],
            selected: {registerMode},
            onSelectionChanged: (value) => setState(() => registerMode = value.first),
          ),
          const SizedBox(height: 16),
          TextField(controller: email, keyboardType: TextInputType.emailAddress, decoration: const InputDecoration(labelText: 'Email')),
          if (registerMode) TextField(controller: displayName, decoration: const InputDecoration(labelText: 'Display name')),
          TextField(controller: password, obscureText: true, decoration: const InputDecoration(labelText: 'Password')),
          const SizedBox(height: 20),
          FilledButton(
            onPressed: loading ? null : submit,
            child: Text(loading ? 'Please wait...' : registerMode ? 'Create account' : 'Login'),
          ),
        ],
      ),
    );
  }
}
