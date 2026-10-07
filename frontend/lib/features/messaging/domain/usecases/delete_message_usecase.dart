import '../repositories/message_repository.dart';

class DeleteMessageUseCase {
  final MessageRepository _repository;

  DeleteMessageUseCase(this._repository);

  Future<void> execute(String messageId, {bool forEveryone = false}) {
    return _repository.deleteMessage(messageId);
  }
}