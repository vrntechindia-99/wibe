import '../repositories/status_repository.dart';

class ReplyToStatusUseCase {
  final StatusRepository _repository;

  ReplyToStatusUseCase(this._repository);

  Future<void> execute(String statusId, String content) {
    return _repository.replyToStatus(statusId, content);
  }
}