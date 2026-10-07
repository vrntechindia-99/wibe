import 'package:dio/dio.dart';

import '../../domain/repositories/message_repository.dart';
import '../../domain/entities/message.dart';
import '../../../../data/datasources/remote/remote_message_datasource.dart';
import '../../../../data/datasources/local/local_message_datasource.dart';
import '../../../../core/network/connectivity_service.dart';
import '../../../../data/models/message_model.dart';

class MessageRepositoryImpl implements MessageRepository {
  final RemoteMessageDataSource _remoteDataSource;
  final LocalMessageDataSource _localDataSource;
  final ConnectivityService _connectivityService;

  MessageRepositoryImpl(
    this._remoteDataSource,
    this._localDataSource,
    this._connectivityService,
  );

  @override
  Future<List<Message>> getMessages(String conversationId, {int limit = 50, int offset = 0}) async {
    final isOnline = await _checkConnectivity();

    if (isOnline) {
      try {
        final remoteMessages = await _remoteDataSource.getMessages(conversationId, page: 1, limit: limit);
        for (final msg in remoteMessages) {
          await _localDataSource.cacheMessage(MessageModel.toCompanion(msg));
        }
        return remoteMessages;
      } catch (e) {
        // Fall back to local
      }
    }

    return _localDataSource.getMessages(conversationId, limit: limit, offset: offset);
  }

  @override
  Future<Message?> getMessage(String messageId) async {
    final isOnline = await _checkConnectivity();

    if (isOnline) {
      try {
        // TODO: Implement getMessage in remote
      } catch (_) {}
    }

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
    final isOnline = await _checkConnectivity();

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

    await cacheMessage(message);
  }

  @override
  Future<void> markAsDelivered(String conversationId, String messageId) async {
    final isOnline = await _checkConnectivity();
    if (isOnline) {
      try {
        await _remoteDataSource.markAsDelivered(conversationId, messageId);
      } catch (_) {}
    }
  }

  @override
  Future<void> markAsRead(String conversationId, String messageId) async {
    final isOnline = await _checkConnectivity();
    if (isOnline) {
      try {
        await _remoteDataSource.markAsRead(conversationId, messageId);
      } catch (_) {}
    }
  }

  Future<bool> _checkConnectivity() async {
    final result = await _connectivityService.checkConnectivity();
    return _connectivityService.isConnected(result);
  }
}