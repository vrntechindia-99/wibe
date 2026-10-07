import '../repositories/message_repository.dart';
import '../entities/message.dart';

class GetMessagesUseCase {
  final MessageRepository _repository;

  GetMessagesUseCase(this._repository);

  Future<List<Message>> execute(String conversationId, {int limit = 50, int offset = 0}) {
    return _repository.getMessages(conversationId, limit: limit, offset: offset);
  }
}