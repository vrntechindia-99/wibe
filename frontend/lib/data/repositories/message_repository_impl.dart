import 'package:drift/drift.dart';

import '../../domain/repositories/message_repository.dart';
import '../../domain/entities/message.dart';
import '../../domain/entities/conversation.dart';
import '../datasources/local/local_message_datasource.dart';
import '../datasources/remote/remote_message_datasource.dart';
import '../datasources/local/local_database.dart';
import '../models/message_model.dart';
import '../models/conversation_model.dart';
import '../../../core/network/connectivity_service.dart';

class MessageRepositoryImpl implements MessageRepository {
  final LocalMessageDataSource _localDataSource;
  final RemoteMessageDataSource _remoteDataSource;
  final ConnectivityService _connectivityService;

  MessageRepositoryImpl({
    required LocalMessageDataSource localDataSource,
    required RemoteMessageDataSource remoteDataSource,
    required ConnectivityService connectivityService,
  })  : _localDataSource = localDataSource,
        _remoteDataSource = remoteDataSource,
        _connectivityService = connectivityService;

  @override
  Future<List<Conversation>> getConversations({bool includeArchived = false}) {
    return _localDataSource.getConversations(includeArchived: includeArchived);
  }

  @override
  Future<void> cacheConversation(Conversation conversation) {
    return _localDataSource.cacheConversation(ConversationModel.toCompanion(conversation));
  }

  @override
  Future<void> updateConversation(Conversation conversation) {
    return _localDataSource.updateConversation(ConversationModel.toCompanion(conversation));
  }

  @override
  Future<Conversation?> getConversation(String conversationId) {
    return _localDataSource.getConversation(conversationId);
  }

  @override
  Stream<List<Conversation>> watchConversations() {
    // TODO: Implement with Drift stream
    throw UnimplementedError();
  }

  @override
  Future<List<Message>> getMessages(String conversationId, {int limit = 50, int offset = 0}) {
    return _localDataSource.getMessages(conversationId, limit: limit, offset: offset);
  }

  @override
  Future<Message?> getMessage(String messageId) {
    return _localDataSource.getMessage(messageId);
  }

  @override
  Future<void> cacheMessage(Message message) {
    return _localDataSource.cacheMessage(MessageModel.toCompanion(message));
  }

  @override
  Future<void> updateMessage(Message message) {
    return _localDataSource.updateMessage(MessageModel.toCompanion(message));
  }

  @override
  Future<void> deleteMessage(String messageId) {
    return _localDataSource.deleteMessage(messageId);
  }

  @override
  Future<void> sendMessage(Message message) async {
    final isOnline = await _connectivityService.checkConnectivity().then(_connectivityService.isConnected);

    if (isOnline) {
      try {
        await _remoteDataSource.sendMessage(message.conversationId, message.toJson());
      } catch (e) {
        // Queue for retry
        await _localDataSource.queuePendingMessage(
          PendingMessagesCompanion.insert(
            clientMessageId: message.clientMessageId,
            conversationId: message.conversationId,
            type: message.type.name.toUpperCase(),
            content: Value(message.content),
            replyToId: Value(message.replyToId),
          ),
        );
      }
    } else {
      // Queue for later
      await _localDataSource.queuePendingMessage(
        PendingMessagesCompanion.insert(
          clientMessageId: message.clientMessageId,
          conversationId: message.conversationId,
          type: message.type.name.toUpperCase(),
          content: Value(message.content),
          replyToId: Value(message.replyToId),
        ),
      );
    }

    // Always cache locally first (optimistic)
    await cacheMessage(message);
  }

  @override
  Future<void> markAsDelivered(String conversationId, String messageId) async {
    final isOnline = await _connectivityService.checkConnectivity().then(_connectivityService.isConnected);
    if (isOnline) {
      try {
        await _remoteDataSource.markAsDelivered(conversationId, messageId);
      } catch (_) {
        // Ignore network errors
      }
    }
  }

  @override
  Future<void> markAsRead(String conversationId, String messageId) async {
    final isOnline = await _connectivityService.checkConnectivity().then(_connectivityService.isConnected);
    if (isOnline) {
      try {
        await _remoteDataSource.markAsRead(conversationId, messageId);
      } catch (_) {
        // Ignore network errors
      }
    }
  }

  @override
  Stream<List<Message>> watchMessages(String conversationId) {
    // TODO: Implement with Drift stream
    throw UnimplementedError();
  }

  @override
  Future<void> queuePendingMessage(Message message) {
    return _localDataSource.queuePendingMessage(
      PendingMessagesCompanion.insert(
        clientMessageId: message.clientMessageId,
        conversationId: message.conversationId,
        type: message.type.name.toUpperCase(),
        content: Value(message.content),
        replyToId: Value(message.replyToId),
      ),
    );
  }

  @override
  Future<List<Message>> getPendingMessages() async {
    final pending = await _localDataSource.getPendingMessages();
    return pending.map((p) => Message(
      id: '',
      clientMessageId: p.clientMessageId,
      conversationId: p.conversationId,
      senderId: '', // Will be filled from local user
      type: MessageType.values.firstWhere(
        (e) => e.name.toUpperCase() == p.type,
        orElse: () => MessageType.text,
      ),
      content: p.content,
      status: MessageStatus.created,
      replyToId: p.replyToId,
      isEdited: false,
      isDeleted: false,
      deletedForEveryone: false,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    )).toList();
  }

  @override
  Future<void> removePendingMessage(String clientMessageId) {
    return _localDataSource.removePendingMessage(clientMessageId);
  }

  @override
  Future<void> updatePendingMessage(Message message) {
    return _localDataSource.updatePendingMessage(
      PendingMessagesCompanion(
        clientMessageId: Value(message.clientMessageId),
        conversationId: Value(message.conversationId),
        type: Value(message.type.name.toUpperCase()),
        content: Value(message.content),
        replyToId: Value(message.replyToId),
        retryCount: const Value(0),
        lastRetryAt: Value(DateTime.now()),
      ),
    );
  }
}