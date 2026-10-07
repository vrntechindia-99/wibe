import 'package:equatable/equatable.dart';

enum MediaType { image, video, document, audio }

enum UploadStatus { selected, preparing, uploading, uploaded, processing, ready, failed, retrying }

class MediaAttachment extends Equatable {
  final String id;
  final String messageId;
  final MediaType type;
  final String url;
  final String? thumbnailUrl;
  final String? fileName;
  final String mimeType;
  final int fileSize;
  final int? width;
  final int? height;
  final int? duration; // in milliseconds
  final String? checksum;
  final DateTime createdAt;
  final DateTime? deletedAt;

  const MediaAttachment({
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
    this.checksum,
    required this.createdAt,
    this.deletedAt,
  });

  factory MediaAttachment.fromJson(Map<String, dynamic> json) {
    return MediaAttachment(
      id: json['id'] as String,
      messageId: json['messageId'] as String,
      type: MediaType.values.firstWhere(
        (e) => e.name.toUpperCase() == json['type'],
        orElse: () => MediaType.document,
      ),
      url: json['url'] as String,
      thumbnailUrl: json['thumbnailUrl'] as String?,
      fileName: json['fileName'] as String?,
      mimeType: json['mimeType'] as String,
      fileSize: json['fileSize'] as int,
      width: json['width'] as int?,
      height: json['height'] as int?,
      duration: json['duration'] as int?,
      checksum: json['checksum'] as String?,
      createdAt: DateTime.parse(json['createdAt'] as String),
      deletedAt: json['deletedAt'] != null ? DateTime.parse(json['deletedAt'] as String) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'messageId': messageId,
      'type': type.name.toUpperCase(),
      'url': url,
      'thumbnailUrl': thumbnailUrl,
      'fileName': fileName,
      'mimeType': mimeType,
      'fileSize': fileSize,
      'width': width,
      'height': height,
      'duration': duration,
      'checksum': checksum,
      'createdAt': createdAt.toIso8601String(),
      'deletedAt': deletedAt?.toIso8601String(),
    };
  }

  String get formattedSize {
    if (fileSize < 1024) return '$fileSize B';
    if (fileSize < 1024 * 1024) return '${(fileSize / 1024).toStringAsFixed(1)} KB';
    if (fileSize < 1024 * 1024 * 1024) return '${(fileSize / (1024 * 1024)).toStringAsFixed(1)} MB';
    return '${(fileSize / (1024 * 1024 * 1024)).toStringAsFixed(1)} GB';
  }

  String get formattedDuration {
    if (duration == null) return '';
    final seconds = duration! ~/ 1000;
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
        checksum,
        createdAt,
        deletedAt,
      ];
}

class UploadSession extends Equatable {
  final String id;
  final String userId;
  final MediaType mediaType;
  final String mimeType;
  final String originalFilename;
  final int sizeBytes;
  final String storageKey;
  final String? thumbnailKey;
  final String? caption;
  final String? conversationId;
  final String? clientMessageId;
  final UploadStatus status;
  final double progress;
  final String? uploadId; // For multipart
  final List<UploadPart> parts;
  final String? checksum;
  final DateTime createdAt;
  final DateTime expiresAt;

  const UploadSession({
    required this.id,
    required this.userId,
    required this.mediaType,
    required this.mimeType,
    required this.originalFilename,
    required this.sizeBytes,
    required this.storageKey,
    this.thumbnailKey,
    this.caption,
    this.conversationId,
    this.clientMessageId,
    required this.status,
    required this.progress,
    this.uploadId,
    this.parts = const [],
    this.checksum,
    required this.createdAt,
    required this.expiresAt,
  });

  factory UploadSession.fromJson(Map<String, dynamic> json) {
    return UploadSession(
      id: json['id'] as String,
      userId: json['userId'] as String,
      mediaType: MediaType.values.firstWhere(
        (e) => e.name.toUpperCase() == json['mediaType'],
        orElse: () => MediaType.document,
      ),
      mimeType: json['mimeType'] as String,
      originalFilename: json['originalFilename'] as String,
      sizeBytes: json['sizeBytes'] as int,
      storageKey: json['storageKey'] as String,
      thumbnailKey: json['thumbnailKey'] as String?,
      caption: json['caption'] as String?,
      conversationId: json['conversationId'] as String?,
      clientMessageId: json['clientMessageId'] as String?,
      status: UploadStatus.values.firstWhere(
        (e) => e.name.toUpperCase() == json['status'],
        orElse: () => UploadStatus.selected,
      ),
      progress: (json['progress'] as num?)?.toDouble() ?? 0.0,
      uploadId: json['uploadId'] as String?,
      parts: (json['parts'] as List?)?.map((e) => UploadPart.fromJson(e)).toList() ?? [],
      checksum: json['checksum'] as String?,
      createdAt: DateTime.parse(json['createdAt'] as String),
      expiresAt: DateTime.parse(json['expiresAt'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'userId': userId,
      'mediaType': mediaType.name.toUpperCase(),
      'mimeType': mimeType,
      'originalFilename': originalFilename,
      'sizeBytes': sizeBytes,
      'storageKey': storageKey,
      'thumbnailKey': thumbnailKey,
      'caption': caption,
      'conversationId': conversationId,
      'clientMessageId': clientMessageId,
      'status': status.name.toUpperCase(),
      'progress': progress,
      'uploadId': uploadId,
      'parts': parts.map((e) => e.toJson()).toList(),
      'checksum': checksum,
      'createdAt': createdAt.toIso8601String(),
      'expiresAt': expiresAt.toIso8601String(),
    };
  }

  @override
  List<Object?> get props => [
        id,
        userId,
        mediaType,
        mimeType,
        originalFilename,
        sizeBytes,
        storageKey,
        thumbnailKey,
        caption,
        conversationId,
        clientMessageId,
        status,
        progress,
        uploadId,
        parts,
        checksum,
        createdAt,
        expiresAt,
      ];
}

class UploadPart extends Equatable {
  final int partNumber;
  final String etag;

  const UploadPart({required this.partNumber, required this.etag});

  factory UploadPart.fromJson(Map<String, dynamic> json) {
    return UploadPart(
      partNumber: json['partNumber'] as int,
      etag: json['etag'] as String,
    );
  }

  Map<String, dynamic> toJson() {
    return {'partNumber': partNumber, 'etag': etag};
  }

  @override
  List<Object?> get props => [partNumber, etag];
}