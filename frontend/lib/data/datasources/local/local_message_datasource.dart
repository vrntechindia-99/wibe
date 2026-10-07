import 'package:drift/drift.dart';
import '../../local_database.dart';

class LocalMessageDataSource {
  final LocalDatabase _database;

  LocalMessageDataSource(this._database);

  // Conversations
  Future<void> cacheConversation(ConversationsCompanion conversation) {
    return _database.insertConversation(conversation);
  }

  Future<void> updateConversation(ConversationsCompanion conversation) {
    return _database.updateConversation(conversation);
  }

  Future<List<Conversation>> getConversations({bool includeArchived = false}) {
    return _database.getConversations(includeArchived: includeArchived);
  }

  Future<Conversation?> getConversation(String conversationId) {
    return _database.getConversation(conversationId);
  }

  // Messages
  Future<void> cacheMessage(MessagesCompanion message) {
    return _database.insertMessage(message);
  }

  Future<void> updateMessage(MessagesCompanion message) {
    return _database.updateMessage(message);
  }

  Future<List<Message>> getMessages(String conversationId, {int limit = 50, int offset = 0}) {
    return _database.getMessages(conversationId, limit: limit, offset: offset);
  }

  Future<Message?> getMessage(String messageId) {
    return _database.getMessage(messageId);
  }

  Future<void> deleteMessage(String messageId) {
    return _database.deleteMessage(messageId);
  }

  // Attachments
  Future<void> cacheAttachment(MessageAttachmentsCompanion attachment) {
    return _database.insertAttachment(attachment);
  }

  Future<List<MessageAttachment>> getAttachments(String messageId) {
    return _database.getAttachments(messageId);
  }

  // Users
  Future<void> cacheUser(UsersCompanion user) {
    return _database.insertUser(user);
  }

  Future<void> updateUser(UsersCompanion user) {
    return _database.updateUser(user);
  }

  Future<User?> getUser(String userId) {
    return _database.getUser(userId);
  }

  // Pending messages
  Future<void> queuePendingMessage(PendingMessagesCompanion message) {
    return _database.insertPendingMessage(message);
  }

  Future<List<PendingMessage>> getPendingMessages() {
    return _database.getPendingMessages();
  }

  Future<void> updatePendingMessage(PendingMessagesCompanion message) {
    return _database.updatePendingMessage(message);
  }

  Future<void> removePendingMessage(String clientMessageId) {
    return _database.deletePendingMessage(clientMessageId);
  }
}