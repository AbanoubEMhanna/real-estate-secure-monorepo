import 'package:flutter/material.dart';
import 'core/api_client.dart';
import 'features/auth/login_page.dart';
import 'features/properties/property_form_page.dart';

void main() {
  runApp(const RealEstateApp());
}

class RealEstateApp extends StatefulWidget {
  const RealEstateApp({super.key});

  @override
  State<RealEstateApp> createState() => _RealEstateAppState();
}

class _RealEstateAppState extends State<RealEstateApp> {
  final apiClient = ApiClient();
  bool authenticated = false;

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Real Estate',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xff226a5b)),
        useMaterial3: true,
      ),
      home: authenticated
          ? PropertyFormPage(apiClient: apiClient)
          : LoginPage(
              apiClient: apiClient,
              onAuthenticated: () => setState(() => authenticated = true),
            ),
    );
  }
}
