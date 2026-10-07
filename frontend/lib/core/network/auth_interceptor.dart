import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class AuthInterceptor extends Interceptor {
  final FlutterSecureStorage _storage;

  static const String _accessTokenKey = 'access_token';
  static const String _refreshTokenKey = 'refresh_token';

  AuthInterceptor(this._storage);

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) async {
    final accessToken = await _storage.read(key: _accessTokenKey);
    if (accessToken != null) {
      options.headers['Authorization'] = 'Bearer $accessToken';
    }
    super.onRequest(options, handler);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    if (err.response?.statusCode == 401 && err.requestOptions.path != '/auth/refresh') {
      final refreshed = await _refreshToken();
      if (refreshed) {
        // Retry the original request
        final accessToken = await _storage.read(key: _accessTokenKey);
        err.requestOptions.headers['Authorization'] = 'Bearer $accessToken';
        final response = await Dio().fetch(err.requestOptions);
        handler.resolve(response);
        return;
      }
    }
    super.onError(err, handler);
  }

  Future<bool> _refreshToken() async {
    try {
      final refreshToken = await _storage.read(key: _refreshTokenKey);
      if (refreshToken == null) return false;

      final dio = Dio(BaseOptions(baseUrl: 'http://10.0.2.2:3000/api/v1'));
      final response = await dio.post('/auth/refresh', data: {'refreshToken': refreshToken});

      if (response.statusCode == 200) {
        final data = response.data;
        await _storage.write(key: _accessTokenKey, value: data['accessToken']);
        await _storage.write(key: _refreshTokenKey, value: data['refreshToken']);
        return true;
      }
    } catch (e) {
      // Clear tokens on failure
      await clearTokens();
    }
    return false;
  }

  Future<void> saveTokens(String accessToken, String refreshToken) async {
    await _storage.write(key: _accessTokenKey, value: accessToken);
    await _storage.write(key: _refreshTokenKey, value: refreshToken);
  }

  Future<void> clearTokens() async {
    await _storage.delete(key: _accessTokenKey);
    await _storage.delete(key: _refreshTokenKey);
  }

  Future<String?> getAccessToken() async {
    return _storage.read(key: _accessTokenKey);
  }

  Future<String?> getRefreshToken() async {
    return _storage.read(key: _refreshTokenKey);
  }
}