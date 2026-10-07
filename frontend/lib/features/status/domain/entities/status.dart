import 'package:equatable/equatable.dart';

import '../../../../domain/entities/message.dart';

enum StatusType { text, image, video }

enum StatusPrivacy { contacts, contactsExcept, selected }

class Status extends Equatable {
  final String id;
  final String userId;
  final StatusType type;
  final String? content;
  final String? mediaUrl;
  final String? thumbnailUrl;
  final StatusPrivacy privacy;
  final List<String> selectedUsers;
  final DateTime expiresAt;
  final DateTime createdAt;
  final List<StatusView> views;
  final List<StatusReaction> reactions;
  final String? userDisplayName;
  final String? userAvatarUrl;

  const Status({
    required this.id,
    required this.userId,
    required this.type,
    this.content,
    this.mediaUrl,
    this.thumbnailUrl,
    required this.privacy,
    required this.selectedUsers,
    required this.expiresAt,
    required this.createdAt,
    this.views = const [],
    this.reactions = const [],
    this.userDisplayName,
    this.userAvatarUrl,
  });

  factory Status.fromJson(Map<String, dynamic> json) {
    return Status(
      id: json['id'] as String,
      userId: json['userId'] as String,
      type: StatusType.values.firstWhere(
        (e) => e.name.toUpperCase() == json['type'],
        orElse: () => StatusType.text,
      ),
      content: json['content'] as String?,
      mediaUrl: json['mediaUrl'] as String?,
      thumbnailUrl: json['thumbnailUrl'] as String?,
      privacy: StatusPrivacy.values.firstWhere(
        (e) => e.name.toUpperCase() == json['privacy'],
        orElse: () => StatusPrivacy.contacts,
      ),
      selectedUsers: List<String>.from(json['selectedUsers'] ?? []),
      expiresAt: DateTime.parse(json['expiresAt'] as String),
      createdAt: DateTime.parse(json['createdAt'] as String),
      views: (json['views'] as List? ?? [])
          .map((e) => StatusView.fromJson(e as Map<String, dynamic>))
          .toList(),
      reactions: (json['reactions'] as List? ?? [])
          .map((e) => StatusReaction.fromJson(e as Map<String, dynamic>))
          .toList(),
      userDisplayName: json['userDisplayName'] as String?,
      userAvatarUrl: json['userAvatarUrl'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'userId': userId,
      'type': type.name.toUpperCase(),
      'content': content,
      'mediaUrl': mediaUrl,
      'thumbnailUrl': thumbnailUrl,
      'privacy': privacy.name.toUpperCase(),
      'selectedUsers': selectedUsers,
      'expiresAt': expiresAt.toIso8601String(),
      'createdAt': createdAt.toIso8601String(),
      'views': views.map((e) => e.toJson()).toList(),
      'reactions': reactions.map((e) => e.toJson()).toList(),
      'userDisplayName': userDisplayName,
      'userAvatarUrl': userAvatarUrl,
    };
  }

  bool get isExpired => DateTime.now().isAfter(expiresAt);

  String get timeRemaining {
    final diff = expiresAt.difference(DateTime.now());
    if (diff.isNegative) return 'Expired';
    if (diff.inHours > 0) return '${diff.inHours}h';
    if (diff.inMinutes > 0) return '${diff.inMinutes}m';
    return 'Soon';
  }

  @override
  List<Object?> get props => [
        id,
        userId,
        type,
        content,
        mediaUrl,
        thumbnailUrl,
        privacy,
        selectedUsers,
        expiresAt,
        createdAt,
        views,
        reactions,
      ];
}

class StatusView extends Equatable {
  final String id;
  final String statusId;
  final String viewerId;
  final DateTime viewedAt;

  const StatusView({
    required this.id,
    required this.statusId,
    required this.viewerId,
    required this.viewedAt,
  });

  factory StatusView.fromJson(Map<String, dynamic> json) {
    return StatusView(
      id: json['id'] as String,
      statusId: json['statusId'] as String,
      viewerId: json['viewerId'] as String,
      viewedAt: DateTime.parse(json['viewedAt'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'statusId': statusId,
      'viewerId': viewerId,
      'viewedAt': viewedAt.toIso8601String(),
    };
  }

  @override
  List<Object?> get props => [id, statusId, viewerId, viewedAt];
}

class StatusReaction extends Equatable {
  final String id;
  final String statusId;
  final String userId;
  final String emoji;
  final DateTime createdAt;

  const StatusReaction({
    required this.id,
    required this.statusId,
    required this.userId,
    required this.emoji,
    required this.createdAt,
  });

  factory StatusReaction.fromJson(Map<String, dynamic> json) {
    return StatusReaction(
      id: json['id'] as String,
      statusId: json['statusId'] as String,
      userId: json['userId'] as String,
      emoji: json['emoji'] as String,
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'statusId': statusId,
      'userId': userId,
      'emoji': emoji,
      'createdAt': createdAt.toIso8601String(),
    };
  }

  @override
  List<Object?> get props => [id, statusId, userId, emoji, createdAt];
}