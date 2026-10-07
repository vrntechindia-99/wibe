import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class ApiClient {
  final Dio _dio;

  ApiClient(this._dio);

  Dio get dio => _dio;

  // Auth
  Future<Response> register(String phoneNumber, Map<String, dynamic> deviceInfo) {
    return _dio.post('/auth/register', data: {
      'phoneNumber': phoneNumber,
      ...deviceInfo,
    });
  }

  Future<Response> verifyOtp(String phoneNumber, String otp, Map<String, dynamic> deviceInfo) {
    return _dio.post('/auth/verify-otp', data: {
      'phoneNumber': phoneNumber,
      'otp': otp,
      ...deviceInfo,
    });
  }

  Future<Response> login(String phoneNumber, Map<String, dynamic> deviceInfo) {
    return _dio.post('/auth/login', data: {
      'phoneNumber': phoneNumber,
      ...deviceInfo,
    });
  }

  Future<Response> verifyLoginOtp(String phoneNumber, String otp, Map<String, dynamic> deviceInfo) {
    return _dio.post('/auth/verify-login', data: {
      'phoneNumber': phoneNumber,
      'otp': otp,
      ...deviceInfo,
    });
  }

  Future<Response> refreshToken(String refreshToken) {
    return _dio.post('/auth/refresh', data: {'refreshToken': refreshToken});
  }

  Future<Response> logout(String deviceId) {
    return _dio.post('/auth/logout', data: {'deviceId': deviceId});
  }

  Future<Response> getProfile() {
    return _dio.get('/users/me');
  }

  // Messages
  Future<Response> getConversations({int page = 1, int limit = 20}) {
    return _dio.get('/conversations', queryParameters: {'page': page, 'limit': limit});
  }

  Future<Response> getMessages(String conversationId, {int page = 1, int limit = 50}) {
    return _dio.get('/conversations/$conversationId/messages', queryParameters: {'page': page, 'limit': limit});
  }

  Future<Response> sendMessage(String conversationId, Map<String, dynamic> data) {
    return _dio.post('/conversations/$conversationId/messages', data: data);
  }

  // Users
  Future<Response> searchUsers(String query, {int limit = 20}) {
    return _dio.get('/users/search', queryParameters: {'q': query, 'limit': limit});
  }

  Future<Response> getUserProfile(String userId) {
    return _dio.get('/users/$userId');
  }

  Future<Response> updateProfile(Map<String, dynamic> data) {
    return _dio.put('/users/profile', data: data);
  }

  Future<Response> getAvatarUploadUrl(String fileName, String contentType) {
    return _dio.post('/users/avatar/upload-url', data: {'fileName': fileName, 'contentType': contentType});
  }

  // Privacy
  Future<Response> getPrivacySettings() {
    return _dio.get('/users/privacy/settings');
  }

  Future<Response> updatePrivacySettings(Map<String, dynamic> data) {
    return _dio.put('/users/privacy/settings', data: data);
  }

  // Blocking
  Future<Response> blockUser(String userId) {
    return _dio.post('/users/block/$userId');
  }

  Future<Response> unblockUser(String userId) {
    return _dio.delete('/users/block/$userId');
  }

  Future<Response> getBlockedUsers() {
    return _dio.get('/users/blocked');
  }
}