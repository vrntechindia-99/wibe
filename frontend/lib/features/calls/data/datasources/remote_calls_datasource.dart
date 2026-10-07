import 'package:dio/dio.dart';

import '../../domain/entities/call.dart';
import '../../domain/entities/call_signaling.dart';
import '../../../../core/network/api_client.dart';

class RemoteCallsDataSource {
  final ApiClient _apiClient;

  RemoteCallsDataSource(this._apiClient);

  Future<Call> startCall({
    required String conversationId,
    required CallType type,
    String? deviceId,
  }) async {
    final response = await _apiClient.dio.post('/calls', data: {
      'conversationId': conversationId,
      'type': type.name.toUpperCase(),
      if (deviceId != null) 'deviceId': deviceId,
    });
    return Call.fromJson(response.data['data']);
  }

  Future<Call> acceptCall(String callId) async {
    final response = await _apiClient.dio.post('/calls/$callId/accept');
    return Call.fromJson(response.data['data']);
  }

  Future<void> declineCall(String callId) async {
    await _apiClient.dio.post('/calls/$callId/decline');
  }

  Future<void> cancelCall(String callId) async {
    await _apiClient.dio.post('/calls/$callId/cancel');
  }

  Future<void> endCall(String callId) async {
    await _apiClient.dio.post('/calls/$callId/end');
  }

  Future<void> sendOffer(String callId, String sdp) async {
    await _apiClient.dio.post('/calls/$callId/offer', data: {'sdp': sdp});
  }

  Future<void> sendAnswer(String callId, String sdp) async {
    await _apiClient.dio.post('/calls/$callId/answer', data: {'sdp': sdp});
  }

  Future<void> sendIceCandidate(String callId, IceCandidateData candidate) async {
    await _apiClient.dio.post('/calls/$callId/ice-candidate', data: candidate.toJson());
  }

  Future<Call> getCall(String callId) async {
    final response = await _apiClient.dio.get('/calls/$callId');
    return Call.fromJson(response.data['data']);
  }

  Future<Call?> getActiveCall() async {
    final response = await _apiClient.dio.get('/calls/active');
    if (response.data['data'] == null) return null;
    return Call.fromJson(response.data['data']);
  }

  Future<CallHistoryResponse> getCallHistory({
    int page = 1,
    int limit = 20,
  }) async {
    final response = await _apiClient.dio.get(
      '/calls',
      queryParameters: {'page': page, 'limit': limit},
    );
    final data = response.data['data'] as List;
    final meta = response.data['meta'];
    return CallHistoryResponse(
      calls: data.map((json) => Call.fromJson(json)).toList(),
      page: meta['page'],
      limit: meta['limit'],
      total: meta['total'],
      totalPages: meta['totalPages'],
    );
  }

  Future<List<IceServer>> getIceServers() async {
    final response = await _apiClient.dio.get('/calls/ice-servers');
    final data = response.data['data']['iceServers'] as List;
    return data.map((json) => IceServer.fromJson(json)).toList();
  }
}