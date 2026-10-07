import '../repositories/conversation_repository.dart';

class UnmuteConversationUseCase {
  final ConversationRepository _repository;

  UnmuteConversationUseCase(this._repository);

  Future<void> execute(String conversationId) {
    return _repository.unmuteConversation(conversationId);
  }
}