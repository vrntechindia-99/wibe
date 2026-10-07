import '../repositories/message_repository.dart';
import '../entities/message.dart';

class SendMessageUseCase {
  final MessageRepository _repository;

  SendMessageUseCase(this._repository);

  Future<void> execute(Message message) async {
    await _repository.sendMessage(message);
  }
}