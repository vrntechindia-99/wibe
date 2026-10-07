import '../repositories/status_repository.dart';

class DeleteStatusUseCase {
  final StatusRepository _repository;

  DeleteStatusUseCase(this._repository);

  Future<void> execute(String statusId) {
    return _repository.deleteStatus(statusId);
  }
}