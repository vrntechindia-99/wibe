import 'package:equatable/equatable.dart';

class VoiceMessage extends Equatable {
  final String id;
  final String clientMessageId;
  final String conversationId;
  final String senderId;
  final String audioUrl;
  final int durationMs;
  final List<double>? waveform;
  final DateTime createdAt;
  final bool isPlaying;
  final double playbackProgress;

  const VoiceMessage({
    required this.id,
    required this.clientMessageId,
    required this.conversationId,
    required this.senderId,
    required this.audioUrl,
    required this.durationMs,
    this.waveform,
    required this.createdAt,
    this.isPlaying = false,
    this.playbackProgress = 0.0,
  });

  factory VoiceMessage.fromJson(Map<String, dynamic> json) {
    return VoiceMessage(
      id: json['id'] as String,
      clientMessageId: json['clientMessageId'] as String,
      conversationId: json['conversationId'] as String,
      senderId: json['senderId'] as String,
      audioUrl: json['audioUrl'] as String,
      durationMs: json['durationMs'] as int,
      waveform: (json['waveform'] as List?)?.map((e) => (e as num).toDouble()).toList(),
      createdAt: DateTime.parse(json['createdAt'] as String),
      isPlaying: json['isPlaying'] as bool? ?? false,
      playbackProgress: (json['playbackProgress'] as num?)?.toDouble() ?? 0.0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'clientMessageId': clientMessageId,
      'conversationId': conversationId,
      'senderId': senderId,
      'audioUrl': audioUrl,
      'durationMs': durationMs,
      'waveform': waveform,
      'createdAt': createdAt.toIso8601String(),
      'isPlaying': isPlaying,
      'playbackProgress': playbackProgress,
    };
  }

  VoiceMessage copyWith({
    String? id,
    String? clientMessageId,
    String? conversationId,
    String? senderId,
    String? audioUrl,
    int? durationMs,
    List<double>? waveform,
    DateTime? createdAt,
    bool? isPlaying,
    double? playbackProgress,
  }) {
    return VoiceMessage(
      id: id ?? this.id,
      clientMessageId: clientMessageId ?? this.clientMessageId,
      conversationId: conversationId ?? this.conversationId,
      senderId: senderId ?? this.senderId,
      audioUrl: audioUrl ?? this.audioUrl,
      durationMs: durationMs ?? this.durationMs,
      waveform: waveform ?? this.waveform,
      createdAt: createdAt ?? this.createdAt,
      isPlaying: isPlaying ?? this.isPlaying,
      playbackProgress: playbackProgress ?? this.playbackProgress,
    );
  }

  String get formattedDuration {
    final seconds = durationMs ~/ 1000;
    final minutes = seconds ~/ 60;
    final remainingSeconds = seconds % 60;
    if (minutes > 0) {
      return '${minutes}:${remainingSeconds.toString().padLeft(2, '0')}';
    }
    return '0:${remainingSeconds.toString().padLeft(2, '0')}';
  }

  @override
  List<Object?> get props => [
        id,
        clientMessageId,
        conversationId,
        senderId,
        audioUrl,
        durationMs,
        waveform,
        createdAt,
        isPlaying,
        playbackProgress,
      ];
}

enum RecordingState { idle, recording, locked, paused, stopped }

class RecordingSession extends Equatable {
  final String id;
  final RecordingState state;
  final Duration duration;
  final String? audioPath;
  final List<double> waveform;
  final double amplitude;

  const RecordingSession({
    required this.id,
    required this.state,
    required this.duration,
    this.audioPath,
    this.waveform = const [],
    this.amplitude = 0.0,
  });

  factory RecordingSession.initial() {
    return RecordingSession(
      id: '',
      state: RecordingState.idle,
      duration: Duration.zero,
    );
  }

  RecordingSession copyWith({
    String? id,
    RecordingState? state,
    Duration? duration,
    String? audioPath,
    List<double>? waveform,
    double? amplitude,
  }) {
    return RecordingSession(
      id: id ?? this.id,
      state: state ?? this.state,
      duration: duration ?? this.duration,
      audioPath: audioPath ?? this.audioPath,
      waveform: waveform ?? this.waveform,
      amplitude: amplitude ?? this.amplitude,
    );
  }

  @override
  List<Object?> get props => [id, state, duration, audioPath, waveform, amplitude];
}