import '../repositories/group_repository.dart';

class UpdateGroupSettingsUseCase {
  final GroupRepository _repository;

  UpdateGroupSettingsUseCase(this._repository);

  Future<void> execute(String groupId, Map<String, dynamic> settings) {
    return _repository.updateGroupSettings(groupId, settings);
  }
}