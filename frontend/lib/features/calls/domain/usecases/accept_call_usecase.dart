import '../repositories/calls_repository.dart';

class AcceptCallUseCase {
  final CallsRepository _repository;

  AcceptCallUseCase(this._repository);

  Future<void> execute(String callId) {
    return _repository.acceptCall(callId);
  }
}