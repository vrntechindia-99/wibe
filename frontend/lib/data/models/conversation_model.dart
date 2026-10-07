import 'package:drift/drift.dart';

import '../../domain/entities/conversation.dart';
import '../../data/datasources/local/local_database.dart';

class ConversationModel {
  static ConversationsCompanion toCompanion(Conversation conversation) {
    return ConversationsCompanion.insert(
      conversationId: conversation.id,
      type: conversation.type.name.toUpperCase(),
      name: Value(conversation.name),
      avatarUrl: Value(conversation.avatarUrl),
      lastMessageId: Value(conversation.lastMessageId),
      lastMessageContent: Value(conversation.lastMessage?.content),
      lastMessageType: Value(conversation.lastMessage?.type.name.toUpperCase()),
      lastMessageAt: Value(conversation.lastMessage?.createdAt),
      unreadCount: conversation.unreadCount,
      isPinned: conversation.isPinned,
      isArchived: conversation.isArchived,
      isMuted: conversation.isMuted,
      muteUntil: Value(conversation.muteUntil),
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
    );
  }

  static Conversation fromData(ConversationData data) {
    return Conversation(
      id: data.conversationId,
      type: ConversationType.values.firstWhere(
        (e) => e.name.toUpperCase() == data.type,
        orElse: () => ConversationType.direct,
      ),
      name: data.name,
      avatarUrl: data.avatarUrl,
      lastMessageId: data.lastMessageId,
      unreadCount: data.unreadCount,
      isPinned: data.isPinned,
      isArchived: data.isArchived,
      isMuted: data.isMuted,
      muteUntil: data.muteUntil,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    );
  }
}