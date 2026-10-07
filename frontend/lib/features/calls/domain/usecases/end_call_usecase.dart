import '../repositories/calls_repository.dart';

class EndCallUseCase {
  final CallsRepository _repository;

  EndCallUseCase(this._repository);

  Future<void> execute(String callId) {
    return _repository.endCall(callId);
  }
}