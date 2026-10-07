import 'package:dio/dio.dart';

import '../../domain/repositories/media_repository.dart';
import '../../domain/entities/media_attachment.dart';
import '../datasources/remote_media_datasource.dart';
import '../datasources/local_media_datasource.dart';
import '../../../../core/network/connectivity_service.dart';

class MediaRepositoryImpl implements MediaRepository {
  final RemoteMediaDataSource _remoteDataSource;
  final LocalMediaDataSource _localDataSource;
  final ConnectivityService _connectivityService;

  MediaRepositoryImpl(
    this._remoteDataSource,
    this._localDataSource,
    this._connectivityService,
  );

  @override
  Future<UploadSession> createUploadSession({
    required MediaType mediaType,
    required String mimeType,
    required String originalFilename,
    required int sizeBytes,
    String? caption,
    String? conversationId,
    String? clientMessageId,
  }) async {
    final isOnline = await _checkConnectivity();
    if (!isOnline) {
      throw Exception('Cannot create upload session while offline');
    }

    return _remoteDataSource.createUploadSession(
      mediaType: mediaType,
      mimeType: mimeType,
      originalFilename: originalFilename,
      sizeBytes: sizeBytes,
      caption: caption,
      conversationId: conversationId,
      clientMessageId: clientMessageId,
    );
  }

  @override
  Future<UploadSession> createMultipartUploadSession({
    required MediaType mediaType,
    required String mimeType,
    required String originalFilename,
    required int sizeBytes,
    String? caption,
    String? conversationId,
    String? clientMessageId,
  }) async {
    final isOnline = await _checkConnectivity();
    if (!isOnline) {
      throw Exception('Cannot create upload session while offline');
    }

    return _remoteDataSource.createMultipartUploadSession(
      mediaType: mediaType,
      mimeType: mimeType,
      originalFilename: originalFilename,
      sizeBytes: sizeBytes,
      caption: caption,
      conversationId: conversationId,
      clientMessageId: clientMessageId,
    );
  }

  @override
  Future<String> getPartUploadUrl(String sessionId, int partNumber) async {
    final isOnline = await _checkConnectivity();
    if (!isOnline) {
      throw Exception('Cannot get part URL while offline');
    }

    return _remoteDataSource.getPartUploadUrl(sessionId, partNumber);
  }

  @override
  Future<MessageWithAttachment> completeMultipartUpload(
    String sessionId, {
    String? checksum,
  }) async {
    final isOnline = await _checkConnectivity();
    if (!isOnline) {
      throw Exception('Cannot complete upload while offline');
    }

    final result = await _remoteDataSource.completeMultipartUpload(sessionId, checksum: checksum);
    final attachment = MediaAttachment.fromJson(result['attachment']);
    await _localDataSource.cacheAttachment(attachment);
    return MessageWithAttachment(messageId: result['messageId'], attachment: attachment);
  }

  @override
  Future<MessageWithAttachment> completeSinglePartUpload(
    String sessionId, {
    String? checksum,
  }) async {
    final isOnline = await _checkConnectivity();
    if (!isOnline) {
      throw Exception('Cannot complete upload while offline');
    }

    final result = await _remoteDataSource.completeSinglePartUpload(sessionId, checksum: checksum);
    final attachment = MediaAttachment.fromJson(result['attachment']);
    await _localDataSource.cacheAttachment(attachment);
    return MessageWithAttachment(messageId: result['messageId'], attachment: attachment);
  }

  @override
  Future<MediaAttachment> getAttachment(String attachmentId) async {
    final isOnline = await _checkConnectivity();

    if (isOnline) {
      try {
        return await _remoteDataSource.getAttachment(attachmentId);
      } catch (_) {
        // Fall back to local
      }
    }

    return _localDataSource.getAttachment(attachmentId);
  }

  @override
  Future<String> getDownloadUrl(String attachmentId) async {
    final isOnline = await _checkConnectivity();
    if (!isOnline) {
      throw Exception('Cannot get download URL while offline');
    }
    return _remoteDataSource.getDownloadUrl(attachmentId);
  }

  @override
  Future<void> deleteAttachment(String attachmentId) async {
    final isOnline = await _checkConnectivity();
    if (isOnline) {
      try {
        await _remoteDataSource.deleteAttachment(attachmentId);
      } catch (_) {}
    }
    await _localDataSource.deleteAttachment(attachmentId);
  }

  @override
  Future<List<MediaAttachment>> getConversationMedia(
    String conversationId, {
    MediaType? type,
    int limit = 50,
  }) async {
    final isOnline = await _checkConnectivity();

    if (isOnline) {
      try {
        return await _remoteDataSource.getConversationMedia(conversationId, type: type, limit: limit);
      } catch (_) {
        // Fall back to local
      }
    }

    return _localDataSource.getConversationAttachments(conversationId, type: type, limit: limit);
  }

  Future<bool> _checkConnectivity() async {
    final result = await _connectivityService.checkConnectivity();
    return _connectivityService.isConnected(result);
  }
}