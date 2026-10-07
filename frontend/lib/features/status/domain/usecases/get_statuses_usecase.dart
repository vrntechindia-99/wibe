import '../repositories/status_repository.dart';
import '../entities/status.dart';

class GetStatusesUseCase {
  final StatusRepository _repository;

  GetStatusesUseCase(this._repository);

  Future<List<Status>> execute() {
    return _repository.getContactStatuses();
  }
}