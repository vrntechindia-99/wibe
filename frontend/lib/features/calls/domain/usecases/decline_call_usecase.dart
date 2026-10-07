import '../repositories/calls_repository.dart';

class DeclineCallUseCase {
  final CallsRepository _repository;

  DeclineCallUseCase(this._repository);

  Future<void> execute(String callId) {
    return _repository.declineCall(callId);
  }
}