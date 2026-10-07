import '../repositories/group_repository.dart';
import '../entities/group.dart';

class GetGroupUseCase {
  final GroupRepository _repository;

  GetGroupUseCase(this._repository);

  Future<Group?> execute(String groupId) {
    return _repository.getGroup(groupId);
  }
}