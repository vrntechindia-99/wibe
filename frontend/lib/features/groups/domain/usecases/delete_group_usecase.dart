import '../repositories/group_repository.dart';

class DeleteGroupUseCase {
  final GroupRepository _repository;

  DeleteGroupUseCase(this._repository);

  Future<void> execute(String groupId) {
    return _repository.deleteGroup(groupId);
  }
}