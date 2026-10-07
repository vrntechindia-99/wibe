import 'package:dio/dio.dart';

import '../../domain/entities/status.dart';
import '../../../../core/network/api_client.dart';

class RemoteStatusDataSource {
  final ApiClient _apiClient;

  RemoteStatusDataSource(this._apiClient);

  Future<Status> createStatus({
    required StatusType type,
    required String privacy,
    String? content,
    String? mediaUrl,
    String? thumbnailUrl,
    List<String>? selectedUsers,
  }) async {
    final response = await _apiClient.dio.post('/statuses', data: {
      'type': type.name.toUpperCase(),
      'privacy': privacy.toUpperCase(),
      if (content != null) 'content': content,
      if (mediaUrl != null) 'mediaUrl': mediaUrl,
      if (thumbnailUrl != null) 'thumbnailUrl': thumbnailUrl,
      if (selectedUsers != null) 'selectedUsers': selectedUsers,
    });
    return Status.fromJson(response.data['data']);
  }

  Future<List<Status>> getContactStatuses() async {
    final response = await _apiClient.dio.get('/statuses');
    final data = response.data['data'] as List;
    return data.map((json) => Status.fromJson(json)).toList();
  }

  Future<List<Status>> getUserStatuses(String userId) async {
    final response = await _apiClient.dio.get('/statuses/user/$userId');
    final data = response.data['data'] as List;
    return data.map((json) => Status.fromJson(json)).toList();
  }

  Future<Status> getStatus(String statusId) async {
    final response = await _apiClient.dio.get('/statuses/$statusId');
    return Status.fromJson(response.data['data']);
  }

  Future<void> viewStatus(String statusId) async {
    await _apiClient.dio.post('/statuses/$statusId/view');
  }

  Future<void> replyToStatus(String statusId, String content) async {
    await _apiClient.dio.post('/statuses/$statusId/reply', data: {'content': content});
  }

  Future<void> addReaction(String statusId, String emoji) async {
    await _apiClient.dio.post('/statuses/$statusId/reactions', data: {'emoji': emoji});
  }

  Future<void> removeReaction(String statusId, String emoji) async {
    await _apiClient.dio.delete('/statuses/$statusId/reactions/$emoji');
  }

  Future<void> deleteStatus(String statusId) async {
    await _apiClient.dio.delete('/statuses/$statusId');
  }

  Future<Status> updateStatus(String statusId, {String? content, String? privacy, List<String>? selectedUsers}) async {
    final response = await _apiClient.dio.patch('/statuses/$statusId', data: {
      if (content != null) 'content': content,
      if (privacy != null) 'privacy': privacy.toUpperCase(),
      if (selectedUsers != null) 'selectedUsers': selectedUsers,
    });
    return Status.fromJson(response.data['data']);
  }
}