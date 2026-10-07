import '../../domain/entities/call.dart';
import '../../domain/entities/call_signaling.dart';

class LocalCallsDataSource {
  Future<void> cacheCall(Call call) {
    // TODO: Implement local caching with Drift
    return Future.value();
  }

  Future<Call?> getCall(String callId) {
    // TODO: Implement
    return Future.value(null);
  }

  Future<Call?> getActiveCall() {
    // TODO: Implement
    return Future.value(null);
  }

  Future<CallHistoryResponse> getCallHistory({
    int page = 1,
    int limit = 20,
  }) {
    // TODO: Implement
    return Future.value(CallHistoryResponse(
      calls: [],
      page: page,
      limit: limit,
      total: 0,
      totalPages: 0,
    ));
  }

  Future<void> deleteCall(String callId) {
    // TODO: Implement
    return Future.value();
  }
}