import '../repositories/group_repository.dart';
import '../entities/group.dart';

class GetGroupsUseCase {
  final GroupRepository _repository;

  GetGroupsUseCase(this._repository);

  Future<List<Group>> execute({int page = 1, int limit = 20, String? search}) {
    return _repository.getUserGroups(page: page, limit: limit, search: search);
  }
}