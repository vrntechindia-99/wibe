import '../repositories/group_repository.dart';

class DemoteAdminUseCase {
  final GroupRepository _repository;

  DemoteAdminUseCase(this._repository);

  Future<void> execute(String groupId, String targetUserId) {
    return _repository.demoteAdmin(groupId, targetUserId);
  }
}