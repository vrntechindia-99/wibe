import '../repositories/group_repository.dart';
import '../entities/group.dart';

class CreateGroupUseCase {
  final GroupRepository _repository;

  CreateGroupUseCase(this._repository);

  Future<Group> execute({
    required String name,
    String? description,
    required List<String> memberIds,
  }) {
    return _repository.createGroup(name: name, description: description, memberIds: memberIds);
  }
}