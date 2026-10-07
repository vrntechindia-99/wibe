import 'package:dio/dio.dart';

import '../../domain/entities/media_attachment.dart';
import '../../../../core/network/api_client.dart';

class RemoteMediaDataSource {
  final ApiClient _apiClient;

  RemoteMediaDataSource(this._apiClient);

  Future<Map<String, dynamic>> createUploadSession({
    required MediaType mediaType,
    required String mimeType,
    required String originalFilename,
    required int sizeBytes,
    String? caption,
    String? conversationId,
    String? clientMessageId,
  }) async {
    final response = await _apiClient.dio.post('/media/upload-session', data: {
      'mediaType': mediaType.name.toUpperCase(),
      'mimeType': mimeType,
      'originalFilename': originalFilename,
      'sizeBytes': sizeBytes,
      if (caption != null) 'caption': caption,
      if (conversationId != null) 'conversationId': conversationId,
      if (clientMessageId != null) 'clientMessageId': clientMessageId,
    });
    return response.data['data'] as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> createMultipartUploadSession({
    required MediaType mediaType,
    required String mimeType,
    required String originalFilename,
    required int sizeBytes,
    String? caption,
    String? conversationId,
    String? clientMessageId,
  }) async {
    final response = await _apiClient.dio.post('/media/upload-session/multipart', data: {
      'mediaType': mediaType.name.toUpperCase(),
      'mimeType': mimeType,
      'originalFilename': originalFilename,
      'sizeBytes': sizeBytes,
      if (caption != null) 'caption': caption,
      if (conversationId != null) 'conversationId': conversationId,
      if (clientMessageId != null) 'clientMessageId': clientMessageId,
    });
    return response.data['data'] as Map<String, dynamic>;
  }

  Future<String> getPartUploadUrl(String sessionId, int partNumber) async {
    final response = await _apiClient.dio.get(
      '/media/upload-session/$sessionId/part-url',
      queryParameters: {'partNumber': partNumber},
    );
    return response.data['data']['uploadUrl'] as String;
  }

  Future<Map<String, dynamic>> completeMultipartUpload(
    String sessionId, {
    String? checksum,
  }) async {
    final response = await _apiClient.dio.post(
      '/media/upload-session/$sessionId/complete',
      data: {if (checksum != null) 'checksum': checksum},
    );
    return response.data['data'] as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> completeSinglePartUpload(
    String sessionId, {
    String? checksum,
  }) async {
    final response = await _apiClient.dio.post(
      '/media/upload-session/$sessionId/complete-single',
      data: {if (checksum != null) 'checksum': checksum},
    );
    return response.data['data'] as Map<String, dynamic>;
  }

  Future<MediaAttachment> getAttachment(String attachmentId) async {
    final response = await _apiClient.dio.get('/media/attachment/$attachmentId');
    return MediaAttachment.fromJson(response.data['data']);
  }

  Future<String> getDownloadUrl(String attachmentId) async {
    final response = await _apiClient.dio.get('/media/attachment/$attachmentId/download');
    return response.data['data']['downloadUrl'] as String;
  }

  Future<void> deleteAttachment(String attachmentId) async {
    await _apiClient.dio.delete('/media/attachment/$attachmentId');
  }

  Future<List<MediaAttachment>> getConversationMedia(
    String conversationId, {
    MediaType? type,
    int limit = 50,
  }) async {
    final response = await _apiClient.dio.get(
      '/media/conversation/$conversationId',
      queryParameters: {
        if (type != null) 'type': type.name.toUpperCase(),
        'limit': limit,
      },
    );
    final data = response.data['data'] as List;
    return data.map((e) => MediaAttachment.fromJson(e)).toList();
  }
}