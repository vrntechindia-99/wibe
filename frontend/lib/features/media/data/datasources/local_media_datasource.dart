import 'package:drift/drift.dart';

import '../../domain/entities/media_attachment.dart';
import '../../../../data/datasources/local/local_database.dart';

class LocalMediaDataSource {
  final LocalDatabase _database;

  LocalMediaDataSource(this._database);

  Future<void> cacheAttachment(MediaAttachment attachment) {
    return _database.into(_database.messageAttachments).insert(
      MessageAttachmentsCompanion.insert(
        attachmentId: attachment.id,
        messageId: attachment.messageId,
        type: attachment.type.name.toUpperCase(),
        url: attachment.url,
        thumbnailUrl: Value(attachment.thumbnailUrl),
        fileName: Value(attachment.fileName),
        mimeType: attachment.mimeType,
        fileSize: attachment.fileSize,
        width: Value(attachment.width),
        height: Value(attachment.height),
        duration: Value(attachment.duration),
        createdAt: attachment.createdAt,
      ),
    );
  }

  Future<void> updateAttachment(MediaAttachment attachment) {
    return _database.update(_database.messageAttachments).replace(
      MessageAttachmentsCompanion(
        attachmentId: Value(attachment.id),
        messageId: Value(attachment.messageId),
        type: Value(attachment.type.name.toUpperCase()),
        url: Value(attachment.url),
        thumbnailUrl: Value(attachment.thumbnailUrl),
        fileName: Value(attachment.fileName),
        mimeType: Value(attachment.mimeType),
        fileSize: Value(attachment.fileSize),
        width: Value(attachment.width),
        height: Value(attachment.height),
        duration: Value(attachment.duration),
        createdAt: Value(attachment.createdAt),
      ),
    );
  }

  Future<MediaAttachment?> getAttachment(String attachmentId) async {
    final result = await (_database.select(_database.messageAttachments)
          ..where((a) => a.attachmentId.equals(attachmentId)))
        .getSingleOrNull();
    if (result == null) return null;
    return _mapToAttachment(result);
  }

  Future<List<MediaAttachment>> getConversationAttachments(
    String conversationId, {
    MediaType? type,
    int limit = 50,
  }) async {
    // This would need a join with messages table
    // For simplicity, returning empty list - implement based on actual needs
    return [];
  }

  Future<void> deleteAttachment(String attachmentId) {
    return (_database.delete(_database.messageAttachments)
          ..where((a) => a.attachmentId.equals(attachmentId)))
        .go();
  }

  MediaAttachment _mapToAttachment(MessageAttachmentData data) {
    return MediaAttachment(
      id: data.attachmentId,
      messageId: data.messageId,
      type: MediaType.values.firstWhere(
        (e) => e.name.toUpperCase() == data.type,
        orElse: () => MediaType.document,
      ),
      url: data.url,
      thumbnailUrl: data.thumbnailUrl,
      fileName: data.fileName,
      mimeType: data.mimeType,
      fileSize: data.fileSize,
      width: data.width,
      height: data.height,
      duration: data.duration,
      createdAt: data.createdAt,
    );
  }
}