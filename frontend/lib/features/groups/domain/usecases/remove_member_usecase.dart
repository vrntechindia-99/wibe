import '../repositories/group_repository.dart';

class RemoveMemberUseCase {
  final GroupRepository _repository;

  RemoveMemberUseCase(this._repository);

  Future<void> execute(String groupId, String targetUserId) {
    return _repository.removeMember(groupId, targetUserId);
  }
}