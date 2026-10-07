import '../repositories/group_repository.dart';
import '../entities/group.dart';

class GetGroupMembersUseCase {
  final GroupRepository _repository;

  GetGroupMembersUseCase(this._repository);

  Future<List<GroupMember>> execute(String groupId, {int page = 1, int limit = 50}) {
    return _repository.getGroupMembers(groupId, page: page, limit: limit);
  }
}