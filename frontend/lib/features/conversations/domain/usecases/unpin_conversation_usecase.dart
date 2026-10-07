import '../repositories/conversation_repository.dart';

class UnpinConversationUseCase {
  final ConversationRepository _repository;

  UnpinConversationUseCase(this._repository);

  Future<void> execute(String conversationId) {
    return _repository.unpinConversation(conversationId);
  }
}