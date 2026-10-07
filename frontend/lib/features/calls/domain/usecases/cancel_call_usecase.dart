import '../repositories/calls_repository.dart';

class CancelCallUseCase {
  final CallsRepository _repository;

  CancelCallUseCase(this._repository);

  Future<void> execute(String callId) {
    return _repository.cancelCall(callId);
  }
}