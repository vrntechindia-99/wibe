import '../repositories/group_repository.dart';
import '../entities/group.dart';

class SearchGroupsUseCase {
  final GroupRepository _repository;

  SearchGroupsUseCase(this._repository);

  Future<List<Group>> execute(String query, {int limit = 20}) {
    return _repository.searchGroups(query, limit: limit);
  }
}