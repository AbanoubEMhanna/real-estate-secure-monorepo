import 'dart:io';

import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class ApiClient {
  ApiClient({
    String baseUrl = const String.fromEnvironment(
      'API_BASE_URL',
      defaultValue: 'http://localhost:3001',
    ),
  }) : _dio = Dio(
         BaseOptions(
           baseUrl: baseUrl,
           connectTimeout: const Duration(seconds: 10),
         ),
       );

  final Dio _dio;
  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  Future<void> register(String email, String displayName, String password) async {
    final response = await _dio.post('/auth/register', data: {
      'email': email,
      'displayName': displayName,
      'password': password,
    });
    await _persistTokens(response.data);
  }

  Future<void> login(String email, String password) async {
    final response = await _dio.post('/auth/login', data: {
      'email': email,
      'password': password,
    });
    await _persistTokens(response.data);
  }

  Future<Map<String, dynamic>> uploadImage(File image) async {
    final signature = await _signPropertyImage(image.path.split('/').last);
    final allowedFormats = List<String>.from(signature['allowedFormats'] as List);
    final extension = image.path.split('.').last.toLowerCase();
    final maxBytes = signature['maxBytes'] as int;

    if (!allowedFormats.contains(extension)) {
      throw Exception('Only ${allowedFormats.join(', ')} images are allowed.');
    }

    if (await image.length() > maxBytes) {
      throw Exception('Image must be smaller than ${maxBytes ~/ (1024 * 1024)}MB.');
    }

    final formData = FormData.fromMap({
      'file': await MultipartFile.fromFile(image.path),
      'api_key': signature['apiKey'],
      'signature': signature['signature'],
      ...Map<String, dynamic>.from(signature['params'] as Map),
    });

    final response = await Dio().post(
      signature['uploadUrl'] as String,
      data: formData,
    );
    final uploaded = Map<String, dynamic>.from(response.data);

    return {
      'publicId': uploaded['public_id'],
      'secureUrl': uploaded['secure_url'],
      'width': uploaded['width'],
      'height': uploaded['height'],
      'format': uploaded['format'],
      'bytes': uploaded['bytes'],
    };
  }

  Future<void> createProperty({
    required String title,
    required String description,
    required num price,
    required String city,
    required String address,
    required int bedrooms,
    required int bathrooms,
    required int areaSqm,
    required List<Map<String, dynamic>> images,
  }) async {
    await _dio.post(
      '/properties',
      data: {
        'title': title,
        'description': description,
        'price': price,
        'city': city,
        'address': address,
        'bedrooms': bedrooms,
        'bathrooms': bathrooms,
        'areaSqm': areaSqm,
        'images': images
            .map((image) => {
                  'publicId': image['publicId'],
                  'secureUrl': image['secureUrl'],
                  'width': image['width'],
                  'height': image['height'],
                })
            .toList(),
      },
      options: await _authOptions(),
    );
  }

  Future<Options> _authOptions() async {
    final token = await _storage.read(key: 'accessToken');
    return Options(headers: {'authorization': 'Bearer $token'});
  }

  Future<Map<String, dynamic>> _signPropertyImage(String fileName) async {
    final response = await _dio.post(
      '/uploads/sign-property-image',
      data: {'fileName': fileName},
      options: await _authOptions(),
    );
    return Map<String, dynamic>.from(response.data);
  }

  Future<void> _persistTokens(dynamic data) async {
    await _storage.write(
      key: 'accessToken',
      value: data['accessToken'] as String,
    );
    await _storage.write(
      key: 'refreshToken',
      value: data['refreshToken'] as String,
    );
  }
}
