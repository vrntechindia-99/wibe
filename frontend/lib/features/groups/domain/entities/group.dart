import 'package:equatable/equatable.dart';

enum GroupRole { owner, admin, member }

enum GroupPermission { sendMessages, sendMedia, addMembers, editInfo, changeSettings, promoteAdmins }

class Group extends Equatable {
  final String id;
  final String conversationId;
  final String name;
  final String? description;
  final String? avatarUrl;
  final Map<String, dynamic> settings;
  final GroupRole role;
  final bool isMuted;
  final DateTime? muteUntil;
  final int memberCount;
  final List<GroupMember> members;
  final DateTime createdAt;
  final DateTime updatedAt;

  const Group({
    required this.id,
    required this.conversationId,
    required this.name,
    this.description,
    this.avatarUrl,
    required this.settings,
    required this.role,
    required this.isMuted,
    this.muteUntil,
    required this.memberCount,
    this.members = const [],
    required this.createdAt,
    required this.updatedAt,
  });

  factory Group.fromJson(Map<String, dynamic> json) {
    return Group(
      id: json['id'] as String,
      conversationId: json['conversationId'] as String,
      name: json['name'] as String,
      description: json['description'] as String?,
      avatarUrl: json['avatarUrl'] as String?,
      settings: Map<String, dynamic>.from(json['settings'] as Map? ?? {}),
      role: GroupRole.values.firstWhere(
        (e) => e.name.toUpperCase() == json['role'],
        orElse: () => GroupRole.member,
      ),
      isMuted: json['isMuted'] as bool? ?? false,
      muteUntil: json['muteUntil'] != null ? DateTime.parse(json['muteUntil'] as String) : null,
      memberCount: json['memberCount'] as int? ?? 0,
      members: (json['members'] as List? ?? [])
          .map((e) => GroupMember.fromJson(e as Map<String, dynamic>))
          .toList(),
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'conversationId': conversationId,
      'name': name,
      'description': description,
      'avatarUrl': avatarUrl,
      'settings': settings,
      'role': role.name.toUpperCase(),
      'isMuted': isMuted,
      'muteUntil': muteUntil?.toIso8601String(),
      'memberCount': memberCount,
      'members': members.map((e) => e.toJson()).toList(),
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  bool get isOwner => role == GroupRole.owner;
  bool get isAdmin => role == GroupRole.admin || role == GroupRole.owner;
  bool get canManageMembers => isAdmin;
  bool get canEditGroup => isAdmin || (settings['onlyAdminsCanEditInfo'] != true);
  bool get canChangeSettings => isOwner;
  bool get canPromoteAdmins => isOwner;

  @override
  List<Object?> get props => [
        id,
        conversationId,
        name,
        description,
        avatarUrl,
        settings,
        role,
        isMuted,
        muteUntil,
        memberCount,
        members,
        createdAt,
        updatedAt,
      ];
}

class GroupMember extends Equatable {
  final String id;
  final String groupId;
  final String userId;
  final GroupRole role;
  final DateTime joinedAt;
  final DateTime? leftAt;
  final String? invitedBy;
  final bool isMuted;
  final DateTime? muteUntil;
  final String? displayName;
  final String? avatarUrl;
  final bool isOnline;
  final DateTime? lastSeen;

  const GroupMember({
    required this.id,
    required this.groupId,
    required this.userId,
    required this.role,
    required this.joinedAt,
    this.leftAt,
    this.invitedBy,
    required this.isMuted,
    this.muteUntil,
    this.displayName,
    this.avatarUrl,
    this.isOnline = false,
    this.lastSeen,
  });

  factory GroupMember.fromJson(Map<String, dynamic> json) {
    return GroupMember(
      id: json['id'] as String,
      groupId: json['groupId'] as String,
      userId: json['userId'] as String,
      role: GroupRole.values.firstWhere(
        (e) => e.name.toUpperCase() == json['role'],
        orElse: () => GroupRole.member,
      ),
      joinedAt: DateTime.parse(json['joinedAt'] as String),
      leftAt: json['leftAt'] != null ? DateTime.parse(json['leftAt'] as String) : null,
      invitedBy: json['invitedBy'] as String?,
      isMuted: json['isMuted'] as bool? ?? false,
      muteUntil: json['muteUntil'] != null ? DateTime.parse(json['muteUntil'] as String) : null,
      displayName: json['displayName'] as String?,
      avatarUrl: json['avatarUrl'] as String?,
      isOnline: json['isOnline'] as bool? ?? false,
      lastSeen: json['lastSeen'] != null ? DateTime.parse(json['lastSeen'] as String) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'groupId': groupId,
      'userId': userId,
      'role': role.name.toUpperCase(),
      'joinedAt': joinedAt.toIso8601String(),
      'leftAt': leftAt?.toIso8601String(),
      'invitedBy': invitedBy,
      'isMuted': isMuted,
      'muteUntil': muteUntil?.toIso8601String(),
      'displayName': displayName,
      'avatarUrl': avatarUrl,
      'isOnline': isOnline,
      'lastSeen': lastSeen?.toIso8601String(),
    };
  }

  bool get isOwner => role == GroupRole.owner;
  bool get isAdmin => role == GroupRole.admin || role == GroupRole.owner;

  GroupMember copyWith({
    String? id,
    String? groupId,
    String? userId,
    GroupRole? role,
    DateTime? joinedAt,
    DateTime? leftAt,
    String? invitedBy,
    bool? isMuted,
    DateTime? muteUntil,
    String? displayName,
    String? avatarUrl,
    bool? isOnline,
    DateTime? lastSeen,
  }) {
    return GroupMember(
      id: id ?? this.id,
      groupId: groupId ?? this.groupId,
      userId: userId ?? this.userId,
      role: role ?? this.role,
      joinedAt: joinedAt ?? this.joinedAt,
      leftAt: leftAt ?? this.leftAt,
      invitedBy: invitedBy ?? this.invitedBy,
      isMuted: isMuted ?? this.isMuted,
      muteUntil: muteUntil ?? this.muteUntil,
      displayName: displayName ?? this.displayName,
      avatarUrl: avatarUrl ?? this.avatarUrl,
      isOnline: isOnline ?? this.isOnline,
      lastSeen: lastSeen ?? this.lastSeen,
    );
  }

  @override
  List<Object?> get props => [
        id,
        groupId,
        userId,
        role,
        joinedAt,
        leftAt,
        invitedBy,
        isMuted,
        muteUntil,
        displayName,
        avatarUrl,
        isOnline,
        lastSeen,
      ];
}

class GroupSettings extends Equatable {
  final bool onlyAdminsCanSend;
  final bool onlyAdminsCanEditInfo;
  final bool onlyAdminsCanAddMembers;
  final int maxMembers;

  const GroupSettings({
    this.onlyAdminsCanSend = false,
    this.onlyAdminsCanEditInfo = false,
    this.onlyAdminsCanAddMembers = false,
    this.maxMembers = 500,
  });

  factory GroupSettings.fromJson(Map<String, dynamic> json) {
    return GroupSettings(
      onlyAdminsCanSend: json['onlyAdminsCanSend'] as bool? ?? false,
      onlyAdminsCanEditInfo: json['onlyAdminsCanEditInfo'] as bool? ?? false,
      onlyAdminsCanAddMembers: json['onlyAdminsCanAddMembers'] as bool? ?? false,
      maxMembers: json['maxMembers'] as int? ?? 500,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'onlyAdminsCanSend': onlyAdminsCanSend,
      'onlyAdminsCanEditInfo': onlyAdminsCanEditInfo,
      'onlyAdminsCanAddMembers': onlyAdminsCanAddMembers,
      'maxMembers': maxMembers,
    };
  }

  @override
  List<Object?> get props => [
        onlyAdminsCanSend,
        onlyAdminsCanEditInfo,
        onlyAdminsCanAddMembers,
        maxMembers,
      ];
}