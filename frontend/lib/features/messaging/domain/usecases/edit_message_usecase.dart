import '../repositories/message_repository.dart';

class EditMessageUseCase {
  final MessageRepository _repository;

  EditMessageUseCase(this._repository);

  Future<void> execute(String messageId, String content) {
    return _repository.updateMessage(Message(
      id: messageId,
      clientMessageId: '',
      conversationId: '',
      senderId: '',
      type: MessageType.text,
      content: content,
      status: MessageStatus.sent,
      isEdited: true,
      editedAt: DateTime.now(),
      isDeleted: false,
      deletedForEveryone: false,
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
    ));
  }
}