import 'package:stream_transform/stream_transform.dart';

import '../../domain/repositories/calls_repository.dart';
import '../../domain/entities/call.dart';
import '../../domain/entities/call_signaling.dart';
import '../datasources/remote_calls_datasource.dart';
import '../datasources/local_calls_datasource.dart';
import '../../../../core/network/connectivity_service.dart';

class CallsRepositoryImpl implements CallsRepository {
  final RemoteCallsDataSource _remoteDataSource;
  final LocalCallsDataSource _localDataSource;
  final ConnectivityService _connectivityService;

  CallsRepositoryImpl(
    this._remoteDataSource,
    this._localDataSource,
    this._connectivityService,
  );

  @override
  Future<Call> startCall({
    required String conversationId,
    required CallType type,
    String? deviceId,
  }) async {
    final isOnline = await _checkConnectivity();
    if (!isOnline) {
      throw Exception('Cannot start call while offline');
    }

    return _remoteDataSource.startCall(
      conversationId: conversationId,
      type: type,
      deviceId: deviceId,
    );
  }

  @override
  Future<Call> acceptCall(String callId) async {
    final isOnline = await _checkConnectivity();
    if (!isOnline) {
      throw Exception('Cannot accept call while offline');
    }
    return _remoteDataSource.acceptCall(callId);
  }

  @override
  Future<void> declineCall(String callId) async {
    final isOnline = await _checkConnectivity();
    if (!isOnline) {
      throw Exception('Cannot decline call while offline');
    }
    await _remoteDataSource.declineCall(callId);
  }

  @override
  Future<void> cancelCall(String callId) async {
    final isOnline = await _checkConnectivity();
    if (!isOnline) {
      throw Exception('Cannot cancel call while offline');
    }
    await _remoteDataSource.cancelCall(callId);
  }

  @override
  Future<void> endCall(String callId) async {
    final isOnline = await _checkConnectivity();
    if (!isOnline) {
      throw Exception('Cannot end call while offline');
    }
    await _remoteDataSource.endCall(callId);
  }

  @override
  Future<void> sendOffer(String callId, String sdp) async {
    final isOnline = await _checkConnectivity();
    if (!isOnline) {
      throw Exception('Cannot send offer while offline');
    }
    await _remoteDataSource.sendOffer(callId, sdp);
  }

  @override
  Future<void> sendAnswer(String callId, String sdp) async {
    final isOnline = await _checkConnectivity();
    if (!isOnline) {
      throw Exception('Cannot send answer while offline');
    }
    await _remoteDataSource.sendAnswer(callId, sdp);
  }

  @override
  Future<void> sendIceCandidate(String callId, IceCandidateData candidate) async {
    final isOnline = await _checkConnectivity();
    if (!isOnline) {
      throw Exception('Cannot send ICE candidate while offline');
    }
    await _remoteDataSource.sendIceCandidate(callId, candidate);
  }

  @override
  Future<Call> getCall(String callId) async {
    final isOnline = await _checkConnectivity();

    if (isOnline) {
      try {
        return await _remoteDataSource.getCall(callId);
      } catch (_) {
        // Fall back to local
      }
    }

    return _localDataSource.getCall(callId);
  }

  @override
  Future<Call?> getActiveCall() async {
    final isOnline = await _checkConnectivity();

    if (isOnline) {
      try {
        return await _remoteDataSource.getActiveCall();
      } catch (_) {
        // Fall back to local
      }
    }

    return _localDataSource.getActiveCall();
  }

  @override
  Future<CallHistoryResponse> getCallHistory({
    int page = 1,
    int limit = 20,
  }) async {
    final isOnline = await _checkConnectivity();

    if (isOnline) {
      try {
        return await _remoteDataSource.getCallHistory(page: page, limit: limit);
      } catch (_) {
        // Fall back to local
      }
    }

    return _localDataSource.getCallHistory(page: page, limit: limit);
  }

  @override
  Future<List<IceServer>> getIceServers() async {
    final isOnline = await _checkConnectivity();

    if (isOnline) {
      try {
        return await _remoteDataSource.getIceServers();
      } catch (_) {
        // Fall back to defaults
      }
    }

    // Return default STUN servers
    return [
      IceServer(urls: ['stun:stun.l.google.com:19302']),
      IceServer(urls: ['stun:stun1.l.google.com:19302']),
    ];
  }

  @override
  Stream<CallSignalingEvent> get signalingEvents {
    // TODO: Implement WebSocket-based signaling events
    return const Stream.empty();
  }

  Future<bool> _checkConnectivity() async {
    final result = await _connectivityService.checkConnectivity();
    return _connectivityService.isConnected(result);
  }
}