import '../repositories/status_repository.dart';

class AddStatusReactionUseCase {
  final StatusRepository _repository;

  AddStatusReactionUseCase(this._repository);

  Future<void> execute(String statusId, String emoji) {
    return _repository.addReaction(statusId, emoji);
  }
}