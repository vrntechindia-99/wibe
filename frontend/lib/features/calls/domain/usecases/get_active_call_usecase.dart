import '../repositories/calls_repository.dart';
import '../entities/call.dart';

class GetActiveCallUseCase {
  final CallsRepository _repository;

  GetActiveCallUseCase(this._repository);

  Future<Call?> execute() {
    return _repository.getActiveCall();
  }
}