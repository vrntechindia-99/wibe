import '../repositories/group_repository.dart';

class PromoteAdminUseCase {
  final GroupRepository _repository;

  PromoteAdminUseCase(this._repository);

  Future<void> execute(String groupId, String targetUserId) {
    return _repository.promoteAdmin(groupId, targetUserId);
  }
}