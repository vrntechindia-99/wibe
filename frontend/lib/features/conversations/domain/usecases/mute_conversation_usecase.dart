import '../repositories/conversation_repository.dart';

class MuteConversationUseCase {
  final ConversationRepository _repository;

  MuteConversationUseCase(this._repository);

  Future<void> execute(String conversationId, {int? duration}) {
    return _repository.muteConversation(conversationId, duration: duration);
  }
}