import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../../core/constants/colors.dart';
import '../../../../../core/theme/app_theme.dart';
import '../../domain/entities/media_attachment.dart';
import '../providers/media_providers.dart';

class WibeUploadProgressList extends ConsumerWidget {
  const WibeUploadProgressList({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final activeUploads = ref.watch(activeUploadsProvider);

    if (activeUploads.isEmpty) return const SizedBox.shrink();

    return Container(
      height: 120,
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: ListView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 12),
        children: activeUploads.entries.map((entry) {
          return _UploadProgressCard(
            key: ValueKey(entry.key),
            progress: entry.value,
            onCancel: () => ref.read(activeUploadsProvider.notifier).state = {
              ...activeUploads..remove(entry.key),
            },
            onRetry: () {
              // TODO: Implement retry
            },
          );
        }).toList(),
      ),
    );
  }
}

class _UploadProgressCard extends StatelessWidget {
  final UploadProgress progress;
  final VoidCallback onCancel;
  final VoidCallback onRetry;

  const _UploadProgressCard({
    required this.progress,
    required this.onCancel,
    required this.onRetry,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Container(
      width: 200,
      margin: const EdgeInsets.only(right: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: theme.dividerColor),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              _buildMediaTypeIcon(),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  progress.fileName,
                  style: theme.textTheme.bodySmall?.copyWith(
                    fontWeight: FontWeight.w500,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              if (progress.status == UploadStatus.failed)
                IconButton(
                  icon: Icon(Icons.refresh, size: 18, color: WibeColors.error),
                  onPressed: onRetry,
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
                )
              else
                IconButton(
                  icon: Icon(Icons.close, size: 18, color: theme.colorScheme.onSurfaceVariant),
                  onPressed: onCancel,
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
                ),
            ],
          ),
          const SizedBox(height: 8),
          Stack(
            children: [
              Container(
                height: 6,
                decoration: BoxDecoration(
                  color: theme.colorScheme.surfaceVariant,
                  borderRadius: BorderRadius.circular(3),
                ),
              ),
              FractionallySizedBox(
                widthFactor: progress.progress.clamp(0.0, 1.0),
                child: Container(
                  height: 6,
                  decoration: BoxDecoration(
                    color: _getProgressColor(),
                    borderRadius: BorderRadius.circular(3),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                '${(progress.progress * 100).toStringAsFixed(0)}%',
                style: theme.textTheme.labelSmall?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
              Text(
                _formatBytes(progress.uploadedBytes) + ' / ' + _formatBytes(progress.totalBytes),
                style: theme.textTheme.labelSmall?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
            ],
          ),
          if (progress.error != null) ...[
            const SizedBox(height: 4),
            Text(
              progress.error!,
              style: theme.textTheme.labelSmall?.copyWith(color: WibeColors.error),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildMediaTypeIcon() {
    IconData icon;
    Color color;
    switch (progress.mediaType) {
      case MediaType.image:
        icon = Icons.image;
        color = Colors.green;
        break;
      case MediaType.video:
        icon = Icons.videocam;
        color = Colors.blue;
        break;
      case MediaType.document:
        icon = Icons.insert_drive_file;
        color = Colors.orange;
        break;
      case MediaType.audio:
        icon = Icons.mic;
        color = WibeColors.primary;
        break;
    }
    return Icon(icon, size: 18, color: color);
  }

  Color _getProgressColor() {
    switch (progress.status) {
      case UploadStatus.uploading:
        return WibeColors.primary;
      case UploadStatus.uploaded:
        return WibeColors.success;
      case UploadStatus.processing:
        return WibeColors.warning;
      case UploadStatus.ready:
        return WibeColors.success;
      case UploadStatus.failed:
        return WibeColors.error;
      default:
        return WibeColors.primary;
    }
  }

  String _formatBytes(int bytes) {
    if (bytes < 1024) return '$bytes B';
    if (bytes < 1024 * 1024) return '${(bytes / 1024).toStringAsFixed(1)} KB';
    return '${(bytes / (1024 * 1024)).toStringAsFixed(1)} MB';
  }
}

class WibeMediaPickerSheet extends ConsumerWidget {
  final Function(MediaType, List<XFile>) onMediaSelected;

  const WibeMediaPickerSheet({
    super.key,
    required this.onMediaSelected,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);

    return SafeArea(
      child: Container(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 40,
              height: 4,
              margin: const EdgeInsets.only(bottom: 16),
              decoration: BoxDecoration(
                color: theme.colorScheme.onSurfaceVariant.withOpacity(0.3),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            Text(
              'Attach Media',
              style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                _MediaPickerOption(
                  icon: Icons.photo_library,
                  label: 'Gallery',
                  onTap: () => _pickFromGallery(context, ImageSource.gallery),
                ),
                _MediaPickerOption(
                  icon: Icons.camera_alt,
                  label: 'Camera',
                  onTap: () => _pickFromGallery(context, ImageSource.camera),
                ),
                _MediaPickerOption(
                  icon: Icons.videocam,
                  label: 'Video',
                  onTap: () => _pickVideo(context),
                ),
                _MediaPickerOption(
                  icon: Icons.insert_drive_file,
                  label: 'Document',
                  onTap: () => _pickDocument(context),
                ),
              ],
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }

  Future<void> _pickFromGallery(BuildContext context, ImageSource source) async {
    // TODO: Implement image picker
    Navigator.pop(context);
  }

  Future<void> _pickVideo(BuildContext context) async {
    // TODO: Implement video picker
    Navigator.pop(context);
  }

  Future<void> _pickDocument(BuildContext context) async {
    // TODO: Implement document picker
    Navigator.pop(context);
  }
}

class _MediaPickerOption extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  const _MediaPickerOption({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
        decoration: BoxDecoration(
          color: theme.colorScheme.surfaceVariant,
          borderRadius: BorderRadius.circular(16),
        ),
        child: Column(
          children: [
            Icon(icon, size: 32, color: theme.colorScheme.primary),
            const SizedBox(height: 8),
            Text(
              label,
              style: theme.textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w500),
            ),
          ],
        ),
      ),
    );
  }
}