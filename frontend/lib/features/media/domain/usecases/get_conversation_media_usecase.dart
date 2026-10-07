import '../repositories/media_repository.dart';
import '../../domain/entities/media_attachment.dart';

class GetConversationMediaUseCase {
  final MediaRepository _repository;

  GetConversationMediaUseCase(this._repository);

  Future<List<MediaAttachment>> execute(
    String conversationId, {
    MediaType? type,
    int limit = 50,
  }) {
    return _repository.getConversationMedia(conversationId, type: type, limit: limit);
  }
}