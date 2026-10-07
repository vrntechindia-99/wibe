import '../repositories/calls_repository.dart';
import '../entities/call.dart';

class StartCallUseCase {
  final CallsRepository _repository;

  StartCallUseCase(this._repository);

  Future<Call> execute({
    required String conversationId,
    required CallType type,
    String? deviceId,
  }) {
    return _repository.startCall(
      conversationId: conversationId,
      type: type,
      deviceId: deviceId,
    );
  }
}