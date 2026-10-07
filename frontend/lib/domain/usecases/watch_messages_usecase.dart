import 'package:stream_transform/stream_transform.dart';
import '../repositories/message_repository.dart';
import '../entities/message.dart';

class WatchMessagesUseCase {
  final MessageRepository _repository;

  WatchMessagesUseCase(this._repository);

  Stream<List<Message>> execute(String conversationId) {
    return _repository.watchMessages(conversationId);
  }
}