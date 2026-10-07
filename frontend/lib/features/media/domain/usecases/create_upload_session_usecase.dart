import '../repositories/media_repository.dart';
import '../../domain/entities/media_attachment.dart';

class CreateUploadSessionUseCase {
  final MediaRepository _repository;

  CreateUploadSessionUseCase(this._repository);

  Future<UploadSession> execute({
    required MediaType mediaType,
    required String mimeType,
    required String originalFilename,
    required int sizeBytes,
    String? caption,
    String? conversationId,
    String? clientMessageId,
  }) {
    return _repository.createUploadSession(
      mediaType: mediaType,
      mimeType: mimeType,
      originalFilename: originalFilename,
      sizeBytes: sizeBytes,
      caption: caption,
      conversationId: conversationId,
      clientMessageId: clientMessageId,
    );
  }
}