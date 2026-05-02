import 'dart:io';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../../core/api_client.dart';

class PropertyFormPage extends StatefulWidget {
  const PropertyFormPage({required this.apiClient, super.key});

  final ApiClient apiClient;

  @override
  State<PropertyFormPage> createState() => _PropertyFormPageState();
}

class _PropertyFormPageState extends State<PropertyFormPage> {
  final picker = ImagePicker();
  final title = TextEditingController(text: 'Modern apartment');
  final description = TextEditingController(text: 'Sunny apartment near services.');
  final price = TextEditingController(text: '250000');
  final city = TextEditingController(text: 'Cairo');
  final address = TextEditingController(text: 'New Cairo');
  final bedrooms = TextEditingController(text: '3');
  final bathrooms = TextEditingController(text: '2');
  final areaSqm = TextEditingController(text: '145');
  final uploadedImages = <Map<String, dynamic>>[];
  bool loading = false;

  Future<void> pickAndUpload() async {
    final image = await picker.pickImage(source: ImageSource.gallery, imageQuality: 85);
    if (image == null) {
      return;
    }
    setState(() => loading = true);
    try {
      final uploaded = await widget.apiClient.uploadImage(File(image.path));
      setState(() => uploadedImages.add(uploaded));
    } finally {
      if (mounted) {
        setState(() => loading = false);
      }
    }
  }

  Future<void> submit() async {
    setState(() => loading = true);
    try {
      await widget.apiClient.createProperty(
        title: title.text,
        description: description.text,
        price: num.parse(price.text),
        city: city.text,
        address: address.text,
        bedrooms: int.parse(bedrooms.text),
        bathrooms: int.parse(bathrooms.text),
        areaSqm: int.parse(areaSqm.text),
        images: uploadedImages,
      );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Property saved')));
      }
    } finally {
      if (mounted) {
        setState(() => loading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('New Property')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          TextField(controller: title, decoration: const InputDecoration(labelText: 'Title')),
          TextField(controller: description, maxLines: 3, decoration: const InputDecoration(labelText: 'Description')),
          TextField(controller: price, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Price')),
          TextField(controller: city, decoration: const InputDecoration(labelText: 'City')),
          TextField(controller: address, decoration: const InputDecoration(labelText: 'Address')),
          TextField(controller: bedrooms, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Bedrooms')),
          TextField(controller: bathrooms, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Bathrooms')),
          TextField(controller: areaSqm, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Area sqm')),
          const SizedBox(height: 16),
          OutlinedButton.icon(
            onPressed: loading ? null : pickAndUpload,
            icon: const Icon(Icons.cloud_upload_outlined),
            label: Text('Upload image (${uploadedImages.length})'),
          ),
          FilledButton(
            onPressed: loading ? null : submit,
            child: Text(loading ? 'Saving...' : 'Save property'),
          ),
        ],
      ),
    );
  }
}
