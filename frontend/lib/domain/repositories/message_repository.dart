import '../entities/message.dart';
import '../entities/conversation.dart';

abstract class MessageRepository {
  // Conversations
  Future<List<Conversation>> getConversations({bool includeArchived = false});
  Future<void> cacheConversation(Conversation conversation);
  Future<void> updateConversation(Conversation conversation);
  Future<Conversation?> getConversation(String conversationId);
  Stream<List<Conversation>> watchConversations();

  // Messages
  Future<List<Message>> getMessages(String conversationId, {int limit = 50, int offset = 0});
  Future<Message?> getMessage(String messageId);
  Future<void> cacheMessage(Message message);
  Future<void> updateMessage(Message message);
  Future<void> deleteMessage(String messageId);
  Future<void> sendMessage(Message message);
  Future<void> markAsDelivered(String conversationId, String messageId);
  Future<void> markAsRead(String conversationId, String messageId);
  Stream<List<Message>> watchMessages(String conversationId);

  // Pending messages (offline)
  Future<void> queuePendingMessage(Message message);
  Future<List<Message>> getPendingMessages();
  Future<void> removePendingMessage(String clientMessageId);
  Future<void> updatePendingMessage(Message message);
}