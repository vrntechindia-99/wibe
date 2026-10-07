import 'package:dio/dio.dart';

import '../../domain/repositories/conversation_repository.dart';
import '../../domain/entities/conversation.dart';
import '../../../../data/datasources/remote/remote_message_datasource.dart';
import '../../../../data/datasources/local/local_message_datasource.dart';
import '../../../../core/network/connectivity_service.dart';
import '../../../../data/models/conversation_model.dart';

class ConversationRepositoryImpl implements ConversationRepository {
  final RemoteMessageDataSource _remoteDataSource;
  final LocalMessageDataSource _localDataSource;
  final ConnectivityService _connectivityService;

  ConversationRepositoryImpl(
    this._remoteDataSource,
    this._localDataSource,
    this._connectivityService,
  );

  @override
  Future<List<Conversation>> getConversations({bool includeArchived = false}) async {
    final isOnline = await _checkConnectivity();

    if (isOnline) {
      try {
        final remoteConversations = await _remoteDataSource.getConversations();
        // Cache locally
        for (final conv in remoteConversations) {
          await _localDataSource.cacheConversation(ConversationModel.toCompanion(conv));
        }
        return remoteConversations;
      } catch (e) {
        // Fall back to local
      }
    }

    return _localDataSource.getConversations(includeArchived: includeArchived);
  }

  @override
  Future<Conversation?> getConversation(String conversationId) async {
    final isOnline = await _checkConnectivity();

    if (isOnline) {
      try {
        // TODO: Implement getConversation in remote data source
        // For now, use local
      } catch (e) {
        // Fall back to local
      }
    }

    return _localDataSource.getConversation(conversationId);
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
  Future<Conversation> createDirectConversation(String userId) async {
    final isOnline = await _checkConnectivity();
    if (!isOnline) throw Exception('Offline');

    // TODO: Implement in remote data source
    throw UnimplementedError();
  }

  @override
  Future<Conversation> createGroupConversation(String name, List<String> memberIds) async {
    final isOnline = await _checkConnectivity();
    if (!isOnline) throw Exception('Offline');

    throw UnimplementedError();
  }

  @override
  Future<void> pinConversation(String conversationId) async {
    final isOnline = await _checkConnectivity();
    if (isOnline) {
      try {
        // TODO: Implement
      } catch (_) {}
    }
    // Optimistic update
    final conv = await _localDataSource.getConversation(conversationId);
    if (conv != null) {
      await _localDataSource.updateConversation(conv.copyWith(isPinned: true));
    }
  }

  @override
  Future<void> unpinConversation(String conversationId) async {
    final isOnline = await _checkConnectivity();
    if (isOnline) {
      try {
        // TODO: Implement
      } catch (_) {}
    }
    final conv = await _localDataSource.getConversation(conversationId);
    if (conv != null) {
      await _localDataSource.updateConversation(conv.copyWith(isPinned: false));
    }
  }

  @override
  Future<void> muteConversation(String conversationId, {int? duration}) async {
    final isOnline = await _checkConnectivity();
    if (isOnline) {
      try {
        // TODO: Implement
      } catch (_) {}
    }
    final conv = await _localDataSource.getConversation(conversationId);
    if (conv != null) {
      final muteUntil = duration != null ? DateTime.now().add(Duration(seconds: duration)) : null;
      await _localDataSource.updateConversation(conv.copyWith(isMuted: true, muteUntil: muteUntil));
    }
  }

  @override
  Future<void> unmuteConversation(String conversationId) async {
    final isOnline = await _checkConnectivity();
    if (isOnline) {
      try {
        // TODO: Implement
      } catch (_) {}
    }
    final conv = await _localDataSource.getConversation(conversationId);
    if (conv != null) {
      await _localDataSource.updateConversation(conv.copyWith(isMuted: false, muteUntil: null));
    }
  }

  @override
  Future<void> archiveConversation(String conversationId) async {
    final isOnline = await _checkConnectivity();
    if (isOnline) {
      try {
        // TODO: Implement
      } catch (_) {}
    }
    final conv = await _localDataSource.getConversation(conversationId);
    if (conv != null) {
      await _localDataSource.updateConversation(conv.copyWith(isArchived: true));
    }
  }

  @override
  Future<void> unarchiveConversation(String conversationId) async {
    final isOnline = await _checkConnectivity();
    if (isOnline) {
      try {
        // TODO: Implement
      } catch (_) {}
    }
    final conv = await _localDataSource.getConversation(conversationId);
    if (conv != null) {
      await _localDataSource.updateConversation(conv.copyWith(isArchived: false));
    }
  }

  @override
  Future<void> markUnread(String conversationId) async {
    final isOnline = await _checkConnectivity();
    if (isOnline) {
      try {
        // TODO: Implement
      } catch (_) {}
    }
  }

  @override
  Future<void> deleteConversation(String conversationId, {bool forEveryone = false}) async {
    final isOnline = await _checkConnectivity();
    if (isOnline) {
      try {
        // TODO: Implement
      } catch (_) {}
    }
    // For local, we could soft delete or just remove
    await _localDataSource.deleteMessage(conversationId); // This deletes messages, not conversation
  }

  Future<bool> _checkConnectivity() async {
    final result = await _connectivityService.checkConnectivity();
    return _connectivityService.isConnected(result);
  }
}