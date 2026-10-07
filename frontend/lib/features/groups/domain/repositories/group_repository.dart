import '../entities/group.dart';

abstract class GroupRepository {
  Future<List<Group>> getUserGroups({int page = 1, int limit = 20, String? search});
  Future<Group?> getGroup(String groupId);
  Future<Group> createGroup({required String name, String? description, required List<String> memberIds});
  Future<Group> updateGroup(String groupId, {String? name, String? description, String? avatarUrl});
  Future<Group> updateGroupSettings(String groupId, Map<String, dynamic> settings);
  Future<void> addMembers(String groupId, List<String> memberIds);
  Future<void> removeMember(String groupId, String targetUserId);
  Future<void> leaveGroup(String groupId);
  Future<void> promoteAdmin(String groupId, String targetUserId);
  Future<void> demoteAdmin(String groupId, String targetUserId);
  Future<List<GroupMember>> getGroupMembers(String groupId, {int page = 1, int limit = 50});
  Future<List<Group>> searchGroups(String query, {int limit = 20});
  Future<void> deleteGroup(String groupId);
  Future<String> getAvatarUploadUrl(String groupId, String fileName, String contentType);
  Future<Group> updateGroupAvatar(String groupId, String avatarUrl);
}