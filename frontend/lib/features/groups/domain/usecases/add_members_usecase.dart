import '../repositories/group_repository.dart';

class AddMembersUseCase {
  final GroupRepository _repository;

  AddMembersUseCase(this._repository);

  Future<void> execute(String groupId, List<String> memberIds) {
    return _repository.addMembers(groupId, memberIds);
  }
}