import 'package:equatable/equatable.dart';

enum CallType { voice, video }
enum CallStatus {
  idle,
  initiating,
  ringing,
  accepted,
  connecting,
  connected,
  reconnecting,
  ending,
  ended,
  failed,
  missed,
  declined,
  cancelled,
}

class Call extends Equatable {
  final String id;
  final String conversationId;
  final CallType type;
  final CallStatus status;
  final String callerId;
  final String recipientId;
  final String? deviceId;
  final int durationSeconds;
  final DateTime? startedAt;
  final DateTime? connectedAt;
  final DateTime? endedAt;
  final String? endReason;
  final DateTime createdAt;
  final DateTime updatedAt;
  final String? callerName;
  final String? callerAvatarUrl;
  final String? recipientName;
  final String? recipientAvatarUrl;

  const Call({
    required this.id,
    required this.conversationId,
    required this.type,
    required this.status,
    required this.callerId,
    required this.recipientId,
    this.deviceId,
    required this.durationSeconds,
    this.startedAt,
    this.connectedAt,
    this.endedAt,
    this.endReason,
    required this.createdAt,
    required this.updatedAt,
    this.callerName,
    this.callerAvatarUrl,
    this.recipientName,
    this.recipientAvatarUrl,
  });

  factory Call.fromJson(Map<String, dynamic> json) {
    return Call(
      id: json['id'] as String,
      conversationId: json['conversationId'] as String,
      type: CallType.values.firstWhere(
        (e) => e.name.toUpperCase() == json['type'],
        orElse: () => CallType.voice,
      ),
      status: CallStatus.values.firstWhere(
        (e) => e.name.toLowerCase() == json['status'].toLowerCase(),
        orElse: () => CallStatus.idle,
      ),
      callerId: json['callerId'] as String,
      recipientId: json['recipientId'] as String,
      deviceId: json['deviceId'] as String?,
      durationSeconds: json['durationSeconds'] as int? ?? 0,
      startedAt: json['startedAt'] != null ? DateTime.parse(json['startedAt'] as String) : null,
      connectedAt: json['connectedAt'] != null ? DateTime.parse(json['connectedAt'] as String) : null,
      endedAt: json['endedAt'] != null ? DateTime.parse(json['endedAt'] as String) : null,
      endReason: json['endReason'] as String?,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
      callerName: json['caller']?['displayName'] as String?,
      callerAvatarUrl: json['caller']?['avatarUrl'] as String?,
      recipientName: json['recipient']?['displayName'] as String?,
      recipientAvatarUrl: json['recipient']?['avatarUrl'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'conversationId': conversationId,
      'type': type.name.toUpperCase(),
      'status': status.name.toUpperCase(),
      'callerId': callerId,
      'recipientId': recipientId,
      'deviceId': deviceId,
      'durationSeconds': durationSeconds,
      'startedAt': startedAt?.toIso8601String(),
      'connectedAt': connectedAt?.toIso8601String(),
      'endedAt': endedAt?.toIso8601String(),
      'endReason': endReason,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  bool get isIncoming => false; // Will be determined by current user
  bool get isOutgoing => false; // Will be determined by current user

  String get formattedDuration {
    final hours = durationSeconds ~/ 3600;
    final minutes = (durationSeconds % 3600) ~/ 60;
    final seconds = durationSeconds % 60;
    if (hours > 0) {
      return '${hours}h ${minutes}m ${seconds}s';
    } else if (minutes > 0) {
      return '${minutes}m ${seconds}s';
    } else {
      return '${seconds}s';
    }
  }

  bool get isActive => [
    CallStatus.initiating,
    CallStatus.ringing,
    CallStatus.accepted,
    CallStatus.connecting,
    CallStatus.connected,
    CallStatus.reconnecting,
  ].contains(status);

  bool get isTerminal => [
    CallStatus.ended,
    CallStatus.failed,
    CallStatus.missed,
    CallStatus.declined,
    CallStatus.cancelled,
  ].contains(status);

  @override
  List<Object?> get props => [
        id,
        conversationId,
        type,
        status,
        callerId,
        recipientId,
        deviceId,
        durationSeconds,
        startedAt,
        connectedAt,
        endedAt,
        endReason,
        createdAt,
        updatedAt,
      ];
}

class IceServer extends Equatable {
  final List<String> urls;
  final String? username;
  final String? credential;

  const IceServer({
    required this.urls,
    this.username,
    this.credential,
  });

  factory IceServer.fromJson(Map<String, dynamic> json) {
    return IceServer(
      urls: List<String>.from(json['urls']),
      username: json['username'] as String?,
      credential: json['credential'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'urls': urls,
      if (username != null) 'username': username,
      if (credential != null) 'credential': credential,
    };
  }

  @override
  List<Object?> get props => [urls, username, credential];
}