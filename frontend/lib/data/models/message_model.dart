import 'package:drift/drift.dart';

import '../../domain/entities/message.dart';
import '../../data/datasources/local/local_database.dart';

class MessageModel {
  static MessagesCompanion toCompanion(Message message) {
    return MessagesCompanion.insert(
      messageId: message.id,
      clientMessageId: message.clientMessageId,
      conversationId: message.conversationId,
      senderId: message.senderId,
      type: message.type.name.toUpperCase(),
      content: Value(message.content),
      status: message.status.name.toUpperCase(),
      replyToId: Value(message.replyToId),
      isEdited: message.isEdited,
      editedAt: Value(message.editedAt),
      isDeleted: message.isDeleted,
      deletedForEveryone: message.deletedForEveryone,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
    );
  }

  static Message fromData(MessageData data) {
    return Message(
      id: data.messageId,
      clientMessageId: data.clientMessageId,
      conversationId: data.conversationId,
      senderId: data.senderId,
      type: MessageType.values.firstWhere(
        (e) => e.name.toUpperCase() == data.type,
        orElse: () => MessageType.text,
      ),
      content: data.content,
      status: MessageStatus.values.firstWhere(
        (e) => e.name.toUpperCase() == data.status,
        orElse: () => MessageStatus.created,
      ),
      replyToId: data.replyToId,
      isEdited: data.isEdited,
      editedAt: data.editedAt,
      isDeleted: data.isDeleted,
      deletedForEveryone: data.deletedForEveryone,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    );
  }
}