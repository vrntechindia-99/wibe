import 'package:dio/dio.dart';

import '../../domain/repositories/group_repository.dart';
import '../../domain/entities/group.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/network/connectivity_service.dart';

class GroupRepositoryImpl implements GroupRepository {
  final ApiClient _apiClient;
  final ConnectivityService _connectivityService;

  GroupRepositoryImpl(this._apiClient, this._connectivityService);

  @override
  Future<List<Group>> getUserGroups({int page = 1, int limit = 20, String? search}) async {
    final isOnline = await _checkConnectivity();

    if (isOnline) {
      try {
        final queryParams = <String, dynamic>{
          'page': page,
          'limit': limit,
        };
        if (search != null) queryParams['search'] = search;

        final response = await _apiClient.dio.get('/groups', queryParameters: queryParams);
        final data = response.data['data'] as List;
        return data.map((json) => Group.fromJson(json)).toList();
      } catch (e) {
        // Fall back to local cache if needed
      }
    }

    // TODO: Implement local caching
    return [];
  }

  @override
  Future<Group?> getGroup(String groupId) async {
    final isOnline = await _checkConnectivity();

    if (isOnline) {
      try {
        final response = await _apiClient.dio.get('/groups/$groupId');
        return Group.fromJson(response.data['data']);
      } catch (_) {}
    }

    return null;
  }

  @override
  Future<Group> createGroup({
    required String name,
    String? description,
    required List<String> memberIds,
  }) async {
    final isOnline = await _checkConnectivity();
    if (!isOnline) throw Exception('Offline - cannot create group');

    final response = await _apiClient.dio.post('/groups', data: {
      'name': name,
      'description': description,
      'memberIds': memberIds,
    });
    return Group.fromJson(response.data['data']);
  }

  @override
  Future<Group> updateGroup(
    String groupId, {
    String? name,
    String? description,
    String? avatarUrl,
  }) async {
    final isOnline = await _checkConnectivity();
    if (!isOnline) throw Exception('Offline - cannot update group');

    final response = await _apiClient.dio.patch('/groups/$groupId', data: {
      if (name != null) 'name': name,
      if (description != null) 'description': description,
      if (avatarUrl != null) 'avatarUrl': avatarUrl,
    });
    return Group.fromJson(response.data['data']);
  }

  @override
  Future<Group> updateGroupSettings(String groupId, Map<String, dynamic> settings) async {
    final isOnline = await _checkConnectivity();
    if (!isOnline) throw Exception('Offline - cannot update settings');

    final response = await _apiClient.dio.patch('/groups/$groupId/settings', data: settings);
    return Group.fromJson(response.data['data']);
  }

  @override
  Future<void> addMembers(String groupId, List<String> memberIds) async {
    final isOnline = await _checkConnectivity();
    if (!isOnline) throw Exception('Offline - cannot add members');

    await _apiClient.dio.post('/groups/$groupId/members', data: {'memberIds': memberIds});
  }

  @override
  Future<void> removeMember(String groupId, String targetUserId) async {
    final isOnline = await _checkConnectivity();
    if (!isOnline) throw Exception('Offline - cannot remove member');

    await _apiClient.dio.delete('/groups/$groupId/members/$targetUserId');
  }

  @override
  Future<void> leaveGroup(String groupId) async {
    final isOnline = await _checkConnectivity();
    if (!isOnline) throw Exception('Offline - cannot leave group');

    await _apiClient.dio.post('/groups/$groupId/leave');
  }

  @override
  Future<void> promoteAdmin(String groupId, String targetUserId) async {
    final isOnline = await _checkConnectivity();
    if (!isOnline) throw Exception('Offline - cannot promote');

    await _apiClient.dio.post('/groups/$groupId/members/$targetUserId/promote');
  }

  @override
  Future<void> demoteAdmin(String groupId, String targetUserId) async {
    final isOnline = await _checkConnectivity();
    if (!isOnline) throw Exception('Offline - cannot demote');

    await _apiClient.dio.post('/groups/$groupId/members/$targetUserId/demote');
  }

  @override
  Future<List<GroupMember>> getGroupMembers(String groupId, {int page = 1, int limit = 50}) async {
    final isOnline = await _checkConnectivity();

    if (isOnline) {
      try {
        final response = await _apiClient.dio.get(
          '/groups/$groupId/members',
          queryParameters: {'page': page, 'limit': limit},
        );
        final data = response.data['data'] as List;
        return data.map((json) => GroupMember.fromJson(json)).toList();
      } catch (_) {}
    }

    return [];
  }

  @override
  Future<List<Group>> searchGroups(String query, {int limit = 20}) async {
    final isOnline = await _checkConnectivity();

    if (isOnline) {
      try {
        final response = await _apiClient.dio.get(
          '/groups/search',
          queryParameters: {'q': query, 'limit': limit},
        );
        final data = response.data['data'] as List;
        return data.map((json) => Group.fromJson(json)).toList();
      } catch (_) {}
    }

    return [];
  }

  @override
  Future<void> deleteGroup(String groupId) async {
    final isOnline = await _checkConnectivity();
    if (!isOnline) throw Exception('Offline - cannot delete group');

    await _apiClient.dio.delete('/groups/$groupId');
  }

  @override
  Future<String> getAvatarUploadUrl(String groupId, String fileName, String contentType) async {
    final isOnline = await _checkConnectivity();
    if (!isOnline) throw Exception('Offline - cannot get upload URL');

    final response = await _apiClient.dio.post('/groups/$groupId/avatar/upload-url', data: {
      'fileName': fileName,
      'contentType': contentType,
    });
    return response.data['data']['uploadUrl'] as String;
  }

  @override
  Future<Group> updateGroupAvatar(String groupId, String avatarUrl) async {
    final isOnline = await _checkConnectivity();
    if (!isOnline) throw Exception('Offline - cannot update avatar');

    final response = await _apiClient.dio.put('/groups/$groupId/avatar', data: {'avatarUrl': avatarUrl});
    return Group.fromJson(response.data['data']);
  }

  Future<bool> _checkConnectivity() async {
    final result = await _connectivityService.checkConnectivity();
    return _connectivityService.isConnected(result);
  }
}