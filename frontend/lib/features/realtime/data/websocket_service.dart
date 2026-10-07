import 'dart:async';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:uuid/uuid.dart';

import '../../../../core/network/auth_interceptor.dart';
import '../../../../core/network/connectivity_service.dart';
import '../../../../core/di/injection.dart';

class RealtimeService {
  IO.Socket? _socket;
  final AuthInterceptor _authInterceptor;
  final ConnectivityService _connectivityService;
  final StreamController<Map<String, dynamic>> _eventController = StreamController.broadcast();
  final StreamController<ConnectionState> _connectionStateController = StreamController.broadcast();
  Timer? _reconnectTimer;
  int _reconnectAttempts = 0;
  static const int _maxReconnectAttempts = 10;
  final List<int> _reconnectDelays = [1000, 2000, 4000, 8000, 16000, 30000];
  bool _isConnecting = false;

  RealtimeService(this._authInterceptor, this._connectivityService);

  Stream<Map<String, dynamic>> get events => _eventController.stream;
  Stream<ConnectionState> get connectionState => _connectionStateController.stream;

  Future<void> connect() async {
    if (_socket?.connected == true || _isConnecting) return;

    _isConnecting = true;
    _connectionStateController.add(ConnectionState.connecting);

    try {
      final accessToken = await _authInterceptor.getAccessToken();
      if (accessToken == null) {
        throw Exception('No access token available');
      }

      _socket = IO.io('http://10.0.2.2:3001', <String, dynamic>{
        'transports': ['websocket'],
        'autoConnect': false,
        'auth': {'token': accessToken},
        'reconnection': false, // We handle reconnection manually
      });

      _setupListeners();
      _socket!.connect();
    } catch (e) {
      _isConnecting = false;
      _connectionStateController.add(ConnectionState.disconnected);
      _scheduleReconnect();
    }
  }

  void _setupListeners() {
    _socket!.onConnect((_) {
      _isConnecting = false;
      _reconnectAttempts = 0;
      _connectionStateController.add(ConnectionState.connected);
      _subscribeToConversations();
    });

    _socket!.onDisconnect((_) {
      _connectionStateController.add(ConnectionState.disconnected);
      if (!_isConnecting) {
        _scheduleReconnect();
      }
    });

    _socket!.onConnectError((error) {
      _isConnecting = false;
      _connectionStateController.add(ConnectionState.error);
      _scheduleReconnect();
    });

    // Listen for all events and forward to stream
    _socket!.onAny((event, data) {
      _eventController.add({'event': event, 'data': data});
    });
  }

  Future<void> _subscribeToConversations() async {
    // This would typically fetch from a conversations provider
    // For now, we'll subscribe when needed via subscribe() method
  }

  Future<void> subscribe(List<String> conversationIds) async {
    if (_socket?.connected != true) return;
    _socket!.emit('subscribe', {'conversationIds': conversationIds});
  }

  Future<void> unsubscribe(List<String> conversationIds) async {
    if (_socket?.connected != true) return;
    _socket!.emit('unsubscribe', {'conversationIds': conversationIds});
  }

  Future<void> sendMessage({
    required String conversationId,
    required String clientMessageId,
    String? content,
    String? replyToId,
  }) async {
    if (_socket?.connected != true) {
      throw Exception('WebSocket not connected');
    }

    _socket!.emit('new_message', {
      'conversationId': conversationId,
      'clientMessageId': clientMessageId,
      'content': content,
      'replyToId': replyToId,
    });
  }

  Future<void> sendTypingStarted(String conversationId) async {
    if (_socket?.connected != true) return;
    _socket!.emit('typing_started', {'conversationId': conversationId});
  }

  Future<void> sendTypingStopped(String conversationId) async {
    if (_socket?.connected != true) return;
    _socket!.emit('typing_stopped', {'conversationId': conversationId});
  }

  Future<void> markAsRead(String conversationId, String messageId) async {
    if (_socket?.connected != true) return;
    _socket!.emit('message_read', {'conversationId': conversationId, 'messageId': messageId});
  }

  Future<void> markAsDelivered(String conversationId, String messageId) async {
    if (_socket?.connected != true) return;
    _socket!.emit('message_delivered', {'conversationId': conversationId, 'messageId': messageId});
  }

  void _scheduleReconnect() {
    if (_reconnectAttempts >= _maxReconnectAttempts) {
      _connectionStateController.add(ConnectionState.failed);
      return;
    }

    final delay = _reconnectDelays[_reconnectAttempts.clamp(0, _reconnectDelays.length - 1)];
    _reconnectAttempts++;

    _reconnectTimer?.cancel();
    _reconnectTimer = Timer(Duration(milliseconds: delay), () {
      connect();
    });
  }

  void disconnect() {
    _reconnectTimer?.cancel();
    _socket?.disconnect();
    _socket?.dispose();
    _socket = null;
    _connectionStateController.add(ConnectionState.disconnected);
  }

  void dispose() {
    disconnect();
    _eventController.close();
    _connectionStateController.close();
  }
}

enum ConnectionState {
  disconnected,
  connecting,
  connected,
  error,
  failed,
}

final realtimeServiceProvider = Provider<RealtimeService>((ref) {
  final authInterceptor = ref.read(authInterceptorProvider);
  final connectivityService = ref.read(connectivityServiceProvider);
  return RealtimeService(authInterceptor, connectivityService);
});

final authInterceptorProvider = Provider<AuthInterceptor>((ref) {
  return getIt<AuthInterceptor>();
});