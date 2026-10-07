import '../repositories/calls_repository.dart';
import '../entities/call.dart';

class GetCallHistoryUseCase {
  final CallsRepository _repository;

  GetCallHistoryUseCase(this._repository);

  Future<CallHistoryResponse> execute({
    int page = 1,
    int limit = 20,
  }) {
    return _repository.getCallHistory(page: page, limit: limit);
  }
}