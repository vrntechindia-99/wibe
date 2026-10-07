import 'package:dio/dio.dart';

import '../../network/api_client.dart';
import '../../../domain/entities/message.dart';
import '../../../domain/entities/conversation.dart';

class RemoteMessageDataSource {
  final ApiClient _apiClient;

  RemoteMessageDataSource(this._apiClient);

  Future<List<Conversation>> getConversations({int page = 1, int limit = 20}) async {
    final response = await _apiClient.getConversations(page: page, limit: limit);
    final data = response.data['data'] as List;
    return data.map((json) => Conversation.fromJson(json)).toList();
  }

  Future<List<Message>> getMessages(String conversationId, {int page = 1, int limit = 50}) async {
    final response = await _apiClient.getMessages(conversationId, page: page, limit: limit);
    final data = response.data['data'] as List;
    return data.map((json) => Message.fromJson(json)).toList();
  }

  Future<Message> sendMessage(String conversationId, Map<String, dynamic> data) async {
    final response = await _apiClient.sendMessage(conversationId, data);
    return Message.fromJson(response.data['data']);
  }

  Future<Message> updateMessage(String conversationId, String messageId, Map<String, dynamic> data) async {
    // TODO: Implement
    throw UnimplementedError();
  }

  Future<void> deleteMessage(String conversationId, String messageId, {bool forEveryone = false}) async {
    // TODO: Implement
    throw UnimplementedError();
  }

  Future<void> markAsRead(String conversationId, String messageId) async {
    // TODO: Implement
    throw UnimplementedError();
  }

  Future<void> markAsDelivered(String conversationId, String messageId) async {
    // TODO: Implement
    throw UnimplementedError();
  }
}