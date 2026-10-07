import '../repositories/calls_repository.dart';
import '../entities/call.dart';

class GetCallUseCase {
  final CallsRepository _repository;

  GetCallUseCase(this._repository);

  Future<Call> execute(String callId) {
    return _repository.getCall(callId);
  }
}