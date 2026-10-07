import '../entities/message.dart';

abstract class MessageRepository {
  Future<List<Message>> getMessages(String conversationId, {int limit = 50, int offset = 0});
  Future<Message?> getMessage(String messageId);
  Future<void> cacheMessage(Message message);
  Future<void> updateMessage(Message message);
  Future<void> deleteMessage(String messageId);
  Future<void> sendMessage(Message message);
  Future<void> markAsDelivered(String conversationId, String messageId);
  Future<void> markAsRead(String conversationId, String messageId);
}