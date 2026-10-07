import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/repositories/media_repository_impl.dart';
import '../../domain/repositories/media_repository.dart';
import '../../domain/usecases/create_upload_session_usecase.dart';
import '../../domain/usecases/complete_upload_usecase.dart';
import '../../domain/usecases/get_conversation_media_usecase.dart';
import '../../../../core/di/injection.dart';
import '../../domain/entities/media_attachment.dart';

final mediaRepositoryProvider = Provider<MediaRepository>((ref) {
  return getIt<MediaRepository>();
});

final createUploadSessionUseCaseProvider = Provider<CreateUploadSessionUseCase>((ref) {
  return CreateUploadSessionUseCase(ref.read(mediaRepositoryProvider));
});

final completeUploadUseCaseProvider = Provider<CompleteUploadUseCase>((ref) {
  return CompleteUploadUseCase(ref.read(mediaRepositoryProvider));
});

final getConversationMediaUseCaseProvider = Provider<GetConversationMediaUseCase>((ref) {
  return GetConversationMediaUseCase(ref.read(mediaRepositoryProvider));
});

// Upload state management
final activeUploadsProvider = StateProvider<Map<String, UploadProgress>>((ref) => {});

class UploadProgress {
  final String sessionId;
  final String fileName;
  final MediaType mediaType;
  final int totalBytes;
  int uploadedBytes;
  double progress;
  UploadStatus status;
  String? error;
  String? messageId;
  MediaAttachment? attachment;

  UploadProgress({
    required this.sessionId,
    required this.fileName,
    required this.mediaType,
    required this.totalBytes,
    this.uploadedBytes = 0,
    this.progress = 0.0,
    this.status = UploadStatus.preparing,
    this.error,
    this.messageId,
    this.attachment,
  });

  UploadProgress copyWith({
    String? sessionId,
    String? fileName,
    MediaType? mediaType,
    int? totalBytes,
    int? uploadedBytes,
    double? progress,
    UploadStatus? status,
    String? error,
    String? messageId,
    MediaAttachment? attachment,
  }) {
    return UploadProgress(
      sessionId: sessionId ?? this.sessionId,
      fileName: fileName ?? this.fileName,
      mediaType: mediaType ?? this.mediaType,
      totalBytes: totalBytes ?? this.totalBytes,
      uploadedBytes: uploadedBytes ?? this.uploadedBytes,
      progress: progress ?? this.progress,
      status: status ?? this.status,
      error: error ?? this.error,
      messageId: messageId ?? this.messageId,
      attachment: attachment ?? this.attachment,
    );
  }
}