import '../entities/call.dart';
import '../entities/call_signaling.dart';

abstract class CallsRepository {
  Future<Call> startCall({
    required String conversationId,
    required CallType type,
    String? deviceId,
  });

  Future<Call> acceptCall(String callId);
  Future<void> declineCall(String callId);
  Future<void> cancelCall(String callId);
  Future<void> endCall(String callId);

  Future<void> sendOffer(String callId, String sdp);
  Future<void> sendAnswer(String callId, String sdp);
  Future<void> sendIceCandidate(String callId, IceCandidateData candidate);

  Future<Call> getCall(String callId);
  Future<Call?> getActiveCall();
  Future<CallHistoryResponse> getCallHistory({
    int page = 1,
    int limit = 20,
  });

  Future<List<IceServer>> getIceServers();

  // WebSocket signaling
  Stream<CallSignalingEvent> get signalingEvents;
}

class CallHistoryResponse {
  final List<Call> calls;
  final int page;
  final int limit;
  final int total;
  final int totalPages;

  CallHistoryResponse({
    required this.calls,
    required this.page,
    required this.limit,
    required this.total,
    required this.totalPages,
  });
}