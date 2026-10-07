import 'package:equatable/equatable.dart';

enum MessageType { text, image, video, document, audio, contact, location, sticker }

enum MessageStatus { created, sending, sent, delivered, read, failed }

class Message extends Equatable {
  final String id;
  final String clientMessageId;
  final String conversationId;
  final String senderId;
  final MessageType type;
  final String? content;
  final MessageStatus status;
  final String? replyToId;
  final bool isEdited;
  final DateTime? editedAt;
  final bool isDeleted;
  final bool deletedForEveryone;
  final DateTime createdAt;
  final DateTime updatedAt;
  final List<MessageAttachment> attachments;
  final List<MessageReaction> reactions;

  const Message({
    required this.id,
    required this.clientMessageId,
    required this.conversationId,
    required this.senderId,
    required this.type,
    this.content,
    required this.status,
    this.replyToId,
    required this.isEdited,
    this.editedAt,
    required this.isDeleted,
    required this.deletedForEveryone,
    required this.createdAt,
    required this.updatedAt,
    this.attachments = const [],
    this.reactions = const [],
  });

  factory Message.fromJson(Map<String, dynamic> json) {
    return Message(
      id: json['id'] as String,
      clientMessageId: json['clientMessageId'] as String,
      conversationId: json['conversationId'] as String,
      senderId: json['senderId'] as String,
      type: MessageType.values.firstWhere(
        (e) => e.name.toUpperCase() == json['type'],
        orElse: () => MessageType.text,
      ),
      content: json['content'] as String?,
      status: MessageStatus.values.firstWhere(
        (e) => e.name.toUpperCase() == json['status'],
        orElse: () => MessageStatus.created,
      ),
      replyToId: json['replyToId'] as String?,
      isEdited: json['isEdited'] as bool? ?? false,
      editedAt: json['editedAt'] != null ? DateTime.parse(json['editedAt'] as String) : null,
      isDeleted: json['isDeleted'] as bool? ?? false,
      deletedForEveryone: json['deletedForEveryone'] as bool? ?? false,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
      attachments: (json['attachments'] as List? ?? [])
          .map((e) => MessageAttachment.fromJson(e as Map<String, dynamic>))
          .toList(),
      reactions: (json['reactions'] as List? ?? [])
          .map((e) => MessageReaction.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'clientMessageId': clientMessageId,
      'conversationId': conversationId,
      'senderId': senderId,
      'type': type.name.toUpperCase(),
      'content': content,
      'status': status.name.toUpperCase(),
      'replyToId': replyToId,
      'isEdited': isEdited,
      'editedAt': editedAt?.toIso8601String(),
      'isDeleted': isDeleted,
      'deletedForEveryone': deletedForEveryone,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
      'attachments': attachments.map((e) => e.toJson()).toList(),
      'reactions': reactions.map((e) => e.toJson()).toList(),
    };
  }

  Message copyWith({
    String? id,
    String? clientMessageId,
    String? conversationId,
    String? senderId,
    MessageType? type,
    String? content,
    MessageStatus? status,
    String? replyToId,
    bool? isEdited,
    DateTime? editedAt,
    bool? isDeleted,
    bool? deletedForEveryone,
    DateTime? createdAt,
    DateTime? updatedAt,
    List<MessageAttachment>? attachments,
    List<MessageReaction>? reactions,
  }) {
    return Message(
      id: id ?? this.id,
      clientMessageId: clientMessageId ?? this.clientMessageId,
      conversationId: conversationId ?? this.conversationId,
      senderId: senderId ?? this.senderId,
      type: type ?? this.type,
      content: content ?? this.content,
      status: status ?? this.status,
      replyToId: replyToId ?? this.replyToId,
      isEdited: isEdited ?? this.isEdited,
      editedAt: editedAt ?? this.editedAt,
      isDeleted: isDeleted ?? this.isDeleted,
      deletedForEveryone: deletedForEveryone ?? this.deletedForEveryone,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      attachments: attachments ?? this.attachments,
      reactions: reactions ?? this.reactions,
    );
  }

  @override
  List<Object?> get props => [
        id,
        clientMessageId,
        conversationId,
        senderId,
        type,
        content,
        status,
        replyToId,
        isEdited,
        editedAt,
        isDeleted,
        deletedForEveryone,
        createdAt,
        updatedAt,
        attachments,
        reactions,
      ];
}

class MessageAttachment extends Equatable {
  final String id;
  final String messageId;
  final String type;
  final String url;
  final String? thumbnailUrl;
  final String? fileName;
  final String mimeType;
  final int fileSize;
  final int? width;
  final int? height;
  final int? duration;
  final DateTime createdAt;

  const MessageAttachment({
    required this.id,
    required this.messageId,
    required this.type,
    required this.url,
    this.thumbnailUrl,
    this.fileName,
    required this.mimeType,
    required this.fileSize,
    this.width,
    this.height,
    this.duration,
    required this.createdAt,
  });

  factory MessageAttachment.fromJson(Map<String, dynamic> json) {
    return MessageAttachment(
      id: json['id'] as String,
      messageId: json['messageId'] as String,
      type: json['type'] as String,
      url: json['url'] as String,
      thumbnailUrl: json['thumbnailUrl'] as String?,
      fileName: json['fileName'] as String?,
      mimeType: json['mimeType'] as String,
      fileSize: json['fileSize'] as int,
      width: json['width'] as int?,
      height: json['height'] as int?,
      duration: json['duration'] as int?,
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'messageId': messageId,
      'type': type,
      'url': url,
      'thumbnailUrl': thumbnailUrl,
      'fileName': fileName,
      'mimeType': mimeType,
      'fileSize': fileSize,
      'width': width,
      'height': height,
      'duration': duration,
      'createdAt': createdAt.toIso8601String(),
    };
  }

  @override
  List<Object?> get props => [
        id,
        messageId,
        type,
        url,
        thumbnailUrl,
        fileName,
        mimeType,
        fileSize,
        width,
        height,
        duration,
        createdAt,
      ];
}

class MessageReaction extends Equatable {
  final String id;
  final String messageId;
  final String userId;
  final String emoji;
  final DateTime createdAt;

  const MessageReaction({
    required this.id,
    required this.messageId,
    required this.userId,
    required this.emoji,
    required this.createdAt,
  });

  factory MessageReaction.fromJson(Map<String, dynamic> json) {
    return MessageReaction(
      id: json['id'] as String,
      messageId: json['messageId'] as String,
      userId: json['userId'] as String,
      emoji: json['emoji'] as String,
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'messageId': messageId,
      'userId': userId,
      'emoji': emoji,
      'createdAt': createdAt.toIso8601String(),
    };
  }

  @override
  List<Object?> get props => [id, messageId, userId, emoji, createdAt];
}