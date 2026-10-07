import '../repositories/group_repository.dart';

class UpdateGroupUseCase {
  final GroupRepository _repository;

  UpdateGroupUseCase(this._repository);

  Future<void> execute(String groupId, {String? name, String? description, String? avatarUrl}) {
    return _repository.updateGroup(groupId, name: name, description: description, avatarUrl: avatarUrl);
  }
}