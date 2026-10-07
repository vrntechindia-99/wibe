import '../../domain/entities/media_attachment.dart';

abstract class MediaRepository {
  Future<UploadSession> createUploadSession({
    required MediaType mediaType,
    required String mimeType,
    required String originalFilename,
    required int sizeBytes,
    String? caption,
    String? conversationId,
    String? clientMessageId,
  });

  Future<UploadSession> createMultipartUploadSession({
    required MediaType mediaType,
    required String mimeType,
    required String originalFilename,
    required int sizeBytes,
    String? caption,
    String? conversationId,
    String? clientMessageId,
  });

  Future<String> getPartUploadUrl(String sessionId, int partNumber);

  Future<MessageWithAttachment> completeMultipartUpload(
    String sessionId, {
    String? checksum,
  });

  Future<MessageWithAttachment> completeSinglePartUpload(
    String sessionId, {
    String? checksum,
  });

  Future<MediaAttachment> getAttachment(String attachmentId);

  Future<String> getDownloadUrl(String attachmentId);

  Future<void> deleteAttachment(String attachmentId);

  Future<List<MediaAttachment>> getConversationMedia(
    String conversationId, {
    MediaType? type,
    int limit = 50,
  });
}

class MessageWithAttachment {
  final String messageId;
  final MediaAttachment attachment;

  MessageWithAttachment({required this.messageId, required this.attachment});
}