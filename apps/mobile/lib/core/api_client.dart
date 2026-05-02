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

  Future<Map<String, dynamic>> signUpload() async {
    final response = await _dio.post(
      '/uploads/sign',
      data: {'context': 'property', 'resourceType': 'image'},
      options: await _authOptions(),
    );
    return Map<String, dynamic>.from(response.data);
  }

  Future<Map<String, dynamic>> uploadImage(File image) async {
    final signature = await signUpload();
    final cloudName = signature['cloudName'] as String;
    final formData = FormData.fromMap({
      'file': await MultipartFile.fromFile(image.path),
      'api_key': signature['apiKey'],
      'timestamp': signature['timestamp'],
      'folder': signature['folder'],
      'tags': signature['tags'],
      'signature': signature['signature'],
    });

    final response = await Dio().post(
      'https://api.cloudinary.com/v1_1/$cloudName/image/upload',
      data: formData,
    );
    return Map<String, dynamic>.from(response.data);
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
                  'publicId': image['public_id'],
                  'secureUrl': image['secure_url'],
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
