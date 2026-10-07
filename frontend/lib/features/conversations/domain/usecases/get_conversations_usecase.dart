import '../repositories/conversation_repository.dart';
import '../entities/conversation.dart';

class GetConversationsUseCase {
  final ConversationRepository _repository;

  GetConversationsUseCase(this._repository);

  Future<List<Conversation>> execute({bool includeArchived = false}) {
    return _repository.getConversations(includeArchived: includeArchived);
  }
}