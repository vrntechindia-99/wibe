import '../repositories/conversation_repository.dart';

class UnarchiveConversationUseCase {
  final ConversationRepository _repository;

  UnarchiveConversationUseCase(this._repository);

  Future<void> execute(String conversationId) {
    return _repository.unarchiveConversation(conversationId);
  }
}