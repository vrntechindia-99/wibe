import '../repositories/conversation_repository.dart';

class PinConversationUseCase {
  final ConversationRepository _repository;

  PinConversationUseCase(this._repository);

  Future<void> execute(String conversationId) {
    return _repository.pinConversation(conversationId);
  }
}