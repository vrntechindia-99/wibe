import '../repositories/conversation_repository.dart';

class MarkUnreadUseCase {
  final ConversationRepository _repository;

  MarkUnreadUseCase(this._repository);

  Future<void> execute(String conversationId) {
    return _repository.markUnread(conversationId);
  }
}