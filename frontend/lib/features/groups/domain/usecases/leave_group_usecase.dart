import '../repositories/group_repository.dart';

class LeaveGroupUseCase {
  final GroupRepository _repository;

  LeaveGroupUseCase(this._repository);

  Future<void> execute(String groupId) {
    return _repository.leaveGroup(groupId);
  }
}