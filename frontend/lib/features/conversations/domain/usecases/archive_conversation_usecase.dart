import '../repositories/conversation_repository.dart';

class ArchiveConversationUseCase {
  final ConversationRepository _repository;

  ArchiveConversationUseCase(this._repository);

  Future<void> execute(String conversationId) {
    return _repository.archiveConversation(conversationId);
  }
}