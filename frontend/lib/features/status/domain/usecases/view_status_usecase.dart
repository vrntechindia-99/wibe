import '../repositories/status_repository.dart';

class ViewStatusUseCase {
  final StatusRepository _repository;

  ViewStatusUseCase(this._repository);

  Future<void> execute(String statusId) {
    return _repository.viewStatus(statusId);
  }
}