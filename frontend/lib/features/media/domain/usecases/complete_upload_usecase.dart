import '../repositories/media_repository.dart';
import '../../domain/entities/media_attachment.dart';

class CompleteUploadUseCase {
  final MediaRepository _repository;

  CompleteUploadUseCase(this._repository);

  Future<MessageWithAttachment> execute(
    String sessionId, {
    String? checksum,
    required bool isMultipart,
  }) {
    if (isMultipart) {
      return _repository.completeMultipartUpload(sessionId, checksum: checksum);
    } else {
      return _repository.completeSinglePartUpload(sessionId, checksum: checksum);
    }
  }
}