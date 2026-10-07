import 'dart:async';

import 'package:flutter_webrtc/flutter_webrtc.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/network/connectivity_service.dart';
import '../../../../core/network/auth_interceptor.dart';
import '../../../../core/di/injection.dart';
import '../../../../domain/entities/call.dart';
import '../../../../domain/entities/call_signaling.dart';

typedef OnCallStateChange = void Function(CallEngineState state);
typedef OnRemoteStream = void Function(MediaStream stream);
typedef OnLocalStream = void Function(MediaStream stream);
typedef OnError = void Function(String error);
typedef OnIceCandidate = void Function(RTCIceCandidate candidate);
typedef OnCallEnded = void Function();

enum CallEngineState {
  idle,
  initializing,
  connecting,
  connected,
  reconnecting,
  ended,
  failed,
}

class CallEngine {
  RTCPeerConnection? _peerConnection;
  MediaStream? _localStream;
  MediaStream? _remoteStream;
  CallEngineState _state = CallEngineState.idle;
  String? _callId;
  bool _isInitiator = false;
  bool _isVideo = false;
  String? _callId;
  bool _isMuted = false;
  bool _isCameraOff = false;
  bool _isSpeakerOn = true;
  bool _isFrontCamera = true;

  final ConnectivityService _connectivityService;
  final AuthInterceptor _authInterceptor;

  // Callbacks
  OnCallStateChange? onStateChange;
  OnRemoteStream? onRemoteStream;
  OnLocalStream? onLocalStream;
  OnError? onError;
  OnIceCandidate? onIceCandidate;
  OnCallEnded? onCallEnded;

  CallEngine(this._connectivityService, this._authInterceptor);

  CallEngineState get state => _state;
  MediaStream? get localStream => _localStream;
  MediaStream? get remoteStream => _remoteStream;
  bool get isMuted => _isMuted;
  bool get isCameraOff => _isCameraOff;
  bool get isSpeakerOn => _isSpeakerOn;
  bool get isFrontCamera => _isFrontCamera;
  String? get callId => _callId;
  bool get isInitiator => _isInitiator;

  Future<void> initialize({
    required String callId,
    required bool isInitiator,
    required bool isVideo,
    required List<RTCIceServer> iceServers,
  }) async {
    _callId = callId;
    _isInitiator = isInitiator;
    _isVideo = isVideo;

    try {
      _setState(CallEngineState.initializing);

      // Create peer connection
      _peerConnection = await createPeerConnection({
        'iceServers': iceServers,
        'iceTransportPolicy': 'all',
        'bundlePolicy': 'max-bundle',
        'rtcpMuxPolicy': 'require',
      });

      _setupPeerConnectionListeners();

      // Get local media
      await _getUserMedia(isVideo);

      if (!_isInitiator) {
        _setState(CallEngineState.connecting);
      }
    } catch (e) {
      _handleError('Failed to initialize call engine: $e');
      rethrow;
    }
  }

  void _setupPeerConnectionListeners() {
    _peerConnection!.onIceCandidate = (RTCIceCandidate candidate) {
      if (candidate.candidate.isNotEmpty) {
        onIceCandidate?.call(candidate);
      }
    };

    _peerConnection!.onIceConnectionState = (RTCIceConnectionState state) {
      _handleIceConnectionStateChange(state);
    };

    _peerConnection!.onConnectionState = (RTCPeerConnectionState state) {
      _handleConnectionStateChange(state);
    };

    _peerConnection!.onTrack = (RTCTrackEvent event) {
      if (event.streams.isNotEmpty) {
        _remoteStream = event.streams[0];
        onRemoteStream?.call(_remoteStream!);
      }
    };
  }

  Future<void> _getUserMedia(bool isVideo) async {
    try {
      final Map<String, dynamic> mediaConstraints = {
        'audio': true,
        'video': isVideo
            ? {
                'facingMode': 'user',
                'width': {'ideal': 1280, 'max': 1920},
                'height': {'ideal': 720, 'max': 1080},
                'frameRate': {'ideal': 30, 'max': 60},
              }
            : false,
      };

      _localStream = await _getUserMediaFromWebRTC(mediaConstraints);

      // Add tracks to peer connection
      for (final track in _localStream!.getTracks()) {
        _peerConnection!.addTrack(track, _localStream!);
      }

      onLocalStream?.call(_localStream!);
    } catch (e) {
      _handleError('Failed to get user media: $e');
      rethrow;
    }
  }

  Future<MediaStream> _getUserMediaFromWebRTC(Map<String, dynamic> constraints) async {
    // Use flutter_webrtc's navigator to get user media
    return await flutter_webrtc.getUserMedia(constraints);
  }

  void _handleIceConnectionStateChange(RTCIceConnectionState state) {
    print('ICE connection state: $state');
    switch (state) {
      case RTCIceConnectionState.connected:
      case RTCIceConnectionState.completed:
        _setState(CallEngineState.connected);
        break;
      case RTCIceConnectionState.disconnected:
        _setState(CallEngineState.reconnecting);
        break;
      case RTCIceConnectionState.failed:
        _setState(CallEngineState.failed);
        onError?.call('ICE connection failed');
        break;
      case RTCIceConnectionState.closed:
        _setState(CallEngineState.ended);
        break;
      default:
        break;
    }
  }

  void _handleConnectionStateChange(RTCPeerConnectionState state) {
    print('Connection state: $state');
    switch (state) {
      case RTCPeerConnectionState.connected:
        _setState(CallEngineState.connected);
        break;
      case RTCPeerConnectionState.disconnected:
        _setState(CallEngineState.reconnecting);
        break;
      case RTCPeerConnectionState.failed:
        _setState(CallEngineState.failed);
        break;
      case RTCPeerConnectionState.closed:
        _setState(CallEngineState.ended);
        break;
      default:
        break;
    }
  }

  Future<void> createOffer() async {
    if (_peerConnection == null) return;

    try {
      final sessionDescription = await _peerConnection!.createOffer();

      await _peerConnection!.setLocalDescription(sessionDescription);
    } catch (e) {
      _handleError('Failed to create offer: $e');
      rethrow;
    }
  }

  Future<void> createAnswer() async {
    if (_peerConnection == null) return;

    try {
      final sessionDescription = await _peerConnection!.createAnswer();

      await _peerConnection!.setLocalDescription(sessionDescription);
    } catch (e) {
      _handleError('Failed to create answer: $e');
      rethrow;
    }
  }

  Future<void> setRemoteDescription(RTCSessionDescriptionInit sdp) async {
    if (_peerConnection == null) return;

    try {
      await _peerConnection!.setRemoteDescription(
        RTCSessionDescription(
          sdp: sdp['sdp'] as String,
          type: sdp['type'] == 'offer' ? RTCSdpType.offer : RTCSdpType.answer,
        ),
      );
    } catch (e) {
      _handleError('Failed to set remote description: $e');
      rethrow;
    }
  }

  Future<void> addIceCandidate(RTCIceCandidate candidate) async {
    if (_peerConnection == null) return;

    try {
      await _peerConnection!.addCandidate(candidate);
    } catch (e) {
      _handleError('Failed to add ICE candidate: $e');
    }
  }

  void toggleMute() {
    _isMuted = !_isMuted;
    for (final track in _localStream!.getAudioTracks()) {
      track.enabled = !_isMuted;
    }
  }

  void toggleCamera() {
    _isCameraOff = !_isCameraOff;
    for (final track in _localStream!.getVideoTracks()) {
      track.enabled = !_isCameraOff;
    }
  }

  Future<void> switchCamera() async {
    if (!_isVideo || _localStream == null) return;

    try {
      final videoTracks = _localStream!.getVideoTracks();
      if (videoTracks.isEmpty) return;

      final oldTrack = videoTracks.first;
      final isFront = _isFrontCamera;

      final newStream = await _getUserMediaFromWebRTC({
        'video': {
          'facingMode': isFront ? 'environment' : 'user',
          'width': {'ideal': 1280, 'max': 1920},
          'height': {'ideal': 720, 'max': 1080},
          'frameRate': {'ideal': 30, 'max': 60},
        },
        'audio': false,
      });

      final newTrack = newStream.getVideoTracks().first;

      // Replace track in peer connection
      final sender = _peerConnection!
          .getSenders()
          .firstWhere((sender) => sender.track?.kind == 'video');

      await sender.replaceTrack(newTrack);

      // Stop old track
      oldTrack.stop();

      // Update local stream
      _localStream!.removeTrack(oldTrack);
      _localStream!.addTrack(newTrack);

      _isFrontCamera = !isFront;
    } catch (e) {
      _handleError('Failed to switch camera: $e');
    }
  }

  void setSpeaker(bool on) {
    _isSpeakerOn = on;
    // Platform-specific audio routing would go here
    // For now, we just track the state
  }

  Future<void> endCall() async {
    _cleanup();
    onCallEnded?.call();
  }

  void _cleanup() {
    // Stop local tracks
    if (_localStream != null) {
      for (final track in _localStream!.getTracks()) {
        track.stop();
      }
      _localStream!.dispose();
      _localStream = null;
    }

    if (_remoteStream != null) {
      _remoteStream!.dispose();
      _remoteStream = null;
    }

    if (_peerConnection != null) {
      _peerConnection!.close();
      _peerConnection = null;
    }

    _state = CallEngineState.ended;
  }

  void _setState(CallEngineState newState) {
    if (_state != newState) {
      _state = newState;
    }
  }

  void _handleError(String message) {
    onError?.call(message);
  }

  void dispose() {
    _cleanup();
  }
}

// Helper function to convert domain IceServer to flutter_webrtc format
List<Map<String, dynamic>> convertIceServers(List<IceServer> iceServers) {
  return iceServers.map((server) {
    return {
      'urls': server.urls,
      if (server.username != null) 'username': server.username,
      if (server.credential != null) 'credential': server.credential,
    };
  }).toList();
}

// Provider for CallEngine
final callEngineProvider = Provider<CallEngine>((ref) {
  final connectivityService = ref.read(connectivityServiceProvider);
  final authInterceptor = ref.read(authInterceptorProvider);
  return CallEngine(connectivityService, authInterceptor);
});