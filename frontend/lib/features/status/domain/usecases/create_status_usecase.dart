import '../repositories/status_repository.dart';
import '../entities/status.dart';

class CreateStatusUseCase {
  final StatusRepository _repository;

  CreateStatusUseCase(this._repository);

  Future<Status> execute({
    required StatusType type,
    required String privacy,
    String? content,
    String? mediaUrl,
    String? thumbnailUrl,
    List<String>? selectedUsers,
  }) {
    return _repository.createStatus(
      type: type,
      privacy: privacy,
      content: content,
      mediaUrl: mediaUrl,
      thumbnailUrl: thumbnailUrl,
      selectedUsers: selectedUsers,
    );
  }
}