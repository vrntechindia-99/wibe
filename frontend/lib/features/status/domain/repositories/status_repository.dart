import '../entities/status.dart';

abstract class StatusRepository {
  Future<Status> createStatus({
    required StatusType type,
    required String privacy,
    String? content,
    String? mediaUrl,
    String? thumbnailUrl,
    List<String>? selectedUsers,
  });

  Future<List<Status>> getContactStatuses();
  Future<List<Status>> getUserStatuses(String userId);
  Future<Status> getStatus(String statusId);
  Future<void> viewStatus(String statusId);
  Future<void> replyToStatus(String statusId, String content);
  Future<void> addReaction(String statusId, String emoji);
  Future<void> removeReaction(String statusId, String emoji);
  Future<void> deleteStatus(String statusId);
  Future<Status> updateStatus(String statusId, {String? content, String? privacy, List<String>? selectedUsers});
}