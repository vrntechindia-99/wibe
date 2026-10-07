import 'package:equatable/equatable.dart';

import 'message.dart';

enum ConversationType { direct, group }

class Conversation extends Equatable {
  final String id;
  final ConversationType type;
  final String? name;
  final String? avatarUrl;
  final String? lastMessageId;
  final Message? lastMessage;
  final int unreadCount;
  final bool isPinned;
  final bool isArchived;
  final bool isMuted;
  final DateTime? muteUntil;
  final DateTime createdAt;
  final DateTime updatedAt;
  final List<ConversationMember> members;

  const Conversation({
    required this.id,
    required this.type,
    this.name,
    this.avatarUrl,
    this.lastMessageId,
    this.lastMessage,
    required this.unreadCount,
    required this.isPinned,
    required this.isArchived,
    required this.isMuted,
    this.muteUntil,
    required this.createdAt,
    required this.updatedAt,
    this.members = const [],
  });

  factory Conversation.fromJson(Map<String, dynamic> json) {
    return Conversation(
      id: json['id'] as String,
      type: ConversationType.values.firstWhere(
        (e) => e.name.toUpperCase() == json['type'],
        orElse: () => ConversationType.direct,
      ),
      name: json['name'] as String?,
      avatarUrl: json['avatarUrl'] as String?,
      lastMessageId: json['lastMessageId'] as String?,
      lastMessage: json['lastMessage'] != null
          ? Message.fromJson(json['lastMessage'] as Map<String, dynamic>)
          : null,
      unreadCount: json['unreadCount'] as int? ?? 0,
      isPinned: json['isPinned'] as bool? ?? false,
      isArchived: json['isArchived'] as bool? ?? false,
      isMuted: json['isMuted'] as bool? ?? false,
      muteUntil: json['muteUntil'] != null ? DateTime.parse(json['muteUntil'] as String) : null,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
      members: (json['members'] as List? ?? [])
          .map((e) => ConversationMember.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'type': type.name.toUpperCase(),
      'name': name,
      'avatarUrl': avatarUrl,
      'lastMessageId': lastMessageId,
      'lastMessage': lastMessage?.toJson(),
      'unreadCount': unreadCount,
      'isPinned': isPinned,
      'isArchived': isArchived,
      'isMuted': isMuted,
      'muteUntil': muteUntil?.toIso8601String(),
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
      'members': members.map((e) => e.toJson()).toList(),
    };
  }

  String getDisplayName(String currentUserId) {
    if (type == ConversationType.group) {
      return name ?? 'Group';
    }
    final otherMember = members.firstWhere(
      (m) => m.userId != currentUserId,
      orElse: () => ConversationMember(
        id: '',
        conversationId: id,
        userId: '',
        displayName: 'Unknown',
        avatarUrl: null,
      ),
    );
    return otherMember.displayName;
  }

  String? getDisplayAvatar(String currentUserId) {
    if (type == ConversationType.group) {
      return avatarUrl;
    }
    final otherMember = members.firstWhere(
      (m) => m.userId != currentUserId,
      orElse: () => ConversationMember(
        id: '',
        conversationId: id,
        userId: '',
        displayName: 'Unknown',
        avatarUrl: null,
      ),
    );
    return otherMember.avatarUrl;
  }

  @override
  List<Object?> get props => [
        id,
        type,
        name,
        avatarUrl,
        lastMessageId,
        lastMessage,
        unreadCount,
        isPinned,
        isArchived,
        isMuted,
        muteUntil,
        createdAt,
        updatedAt,
        members,
      ];
}

class ConversationMember extends Equatable {
  final String id;
  final String conversationId;
  final String userId;
  final String displayName;
  final String? avatarUrl;
  final String? role;
  final DateTime joinedAt;
  final bool isOnline;
  final DateTime? lastSeen;

  const ConversationMember({
    required this.id,
    required this.conversationId,
    required this.userId,
    required this.displayName,
    this.avatarUrl,
    this.role,
    required this.joinedAt,
    required this.isOnline,
    this.lastSeen,
  });

  factory ConversationMember.fromJson(Map<String, dynamic> json) {
    return ConversationMember(
      id: json['id'] as String,
      conversationId: json['conversationId'] as String,
      userId: json['userId'] as String,
      displayName: json['displayName'] as String,
      avatarUrl: json['avatarUrl'] as String?,
      role: json['role'] as String?,
      joinedAt: DateTime.parse(json['joinedAt'] as String),
      isOnline: json['isOnline'] as bool? ?? false,
      lastSeen: json['lastSeen'] != null ? DateTime.parse(json['lastSeen'] as String) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'conversationId': conversationId,
      'userId': userId,
      'displayName': displayName,
      'avatarUrl': avatarUrl,
      'role': role,
      'joinedAt': joinedAt.toIso8601String(),
      'isOnline': isOnline,
      'lastSeen': lastSeen?.toIso8601String(),
    };
  }

  @override
  List<Object?> get props => [
        id,
        conversationId,
        userId,
        displayName,
        avatarUrl,
        role,
        joinedAt,
        isOnline,
        lastSeen,
      ];
}