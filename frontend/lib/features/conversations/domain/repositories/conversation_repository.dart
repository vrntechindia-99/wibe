import '../entities/conversation.dart';

abstract class ConversationRepository {
  Future<List<Conversation>> getConversations({bool includeArchived = false});
  Future<Conversation?> getConversation(String conversationId);
  Future<void> cacheConversation(Conversation conversation);
  Future<void> updateConversation(Conversation conversation);
  Future<Conversation> createDirectConversation(String userId);
  Future<Conversation> createGroupConversation(String name, List<String> memberIds);
  Future<void> pinConversation(String conversationId);
  Future<void> unpinConversation(String conversationId);
  Future<void> muteConversation(String conversationId, {int? duration});
  Future<void> unmuteConversation(String conversationId);
  Future<void> archiveConversation(String conversationId);
  Future<void> unarchiveConversation(String conversationId);
  Future<void> markUnread(String conversationId);
  Future<void> deleteConversation(String conversationId, {bool forEveryone = false});
}