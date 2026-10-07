import 'package:equatable/equatable.dart';

class ReplyPreview extends Equatable {
  final String messageId;
  final String senderId;
  final String senderName;
  final String? content;
  final String? mediaType;
  final String? mediaUrl;
  final String? thumbnailUrl;

  const ReplyPreview({
    required this.messageId,
    required this.senderId,
    required this.senderName,
    this.content,
    this.mediaType,
    this.mediaUrl,
    this.thumbnailUrl,
  });

  factory ReplyPreview.fromMessage(dynamic message) {
    return ReplyPreview(
      messageId: message.id,
      senderId: message.senderId,
      senderName: message.sender?.displayName ?? 'Unknown',
      content: message.content,
      mediaType: message.type != 'TEXT' ? message.type.toLowerCase() : null,
      mediaUrl: message.attachments?.isNotEmpty == true ? message.attachments[0].url : null,
      thumbnailUrl: message.attachments?.isNotEmpty == true ? message.attachments[0].thumbnailUrl : null,
    );
  }

  @override
  List<Object?> get props => [
        messageId,
        senderId,
        senderName,
        content,
        mediaType,
        mediaUrl,
        thumbnailUrl,
      ];
}