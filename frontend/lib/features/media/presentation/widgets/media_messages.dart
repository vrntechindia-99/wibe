import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:video_player/video_player.dart';
import 'package:photo_view/photo_view.dart';
import 'package:photo_view/photo_view_gallery.dart';

import '../../../../../core/constants/colors.dart';
import '../../../../../core/theme/app_theme.dart';
import '../../../../../domain/entities/message.dart';
import '../../../../../domain/entities/media_attachment.dart';
import '../../../../../presentation/shared/widgets/wibe_avatar.dart';

class WibeImageMessage extends StatefulWidget {
  final Message message;
  final bool isSentByMe;
  final VoidCallback? onTap;
  final VoidCallback? onLongPress;

  const WibeImageMessage({
    super.key,
    required this.message,
    required this.isSentByMe,
    this.onTap,
    this.onLongPress,
  });

  @override
  State<WibeImageMessage> createState() => _WibeImageMessageState();
}

class _WibeImageMessageState extends State<WibeImageMessage> {
  MediaAttachment? _attachment;
  bool _imageError = false;

  @override
  void initState() {
    super.initState();
    _attachment = widget.message.attachments.isNotEmpty ? widget.message.attachments.first : null;
  }

  @override
  Widget build(BuildContext context) {
    if (_attachment == null) {
      return _buildErrorPlaceholder();
    }

    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return GestureDetector(
      onTap: widget.onTap,
      onLongPress: widget.onLongPress,
      child: Container(
        constraints: BoxConstraints(
          maxWidth: MediaQuery.of(context).size.width * 0.7,
          maxHeight: 400,
        ),
        decoration: BoxDecoration(
          color: widget.isSentByMe
              ? (isDark ? WibeColors.darkOutgoingBubble : WibeColors.lightOutgoingBubble)
              : (isDark ? WibeColors.darkIncomingBubble : WibeColors.lightIncomingBubble),
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(16),
            topRight: const Radius.circular(16),
            bottomLeft: widget.isSentByMe ? const Radius.circular(16) : const Radius.circular(4),
            bottomRight: widget.isSentByMe ? const Radius.circular(4) : const Radius.circular(16),
          ),
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(16),
            topRight: const Radius.circular(16),
            bottomLeft: widget.isSentByMe ? const Radius.circular(16) : const Radius.circular(4),
            bottomRight: widget.isSentByMe ? const Radius.circular(4) : const Radius.circular(16),
          ),
          child: _imageError
              ? _buildErrorPlaceholder()
              : CachedNetworkImage(
                  imageUrl: _attachment!.thumbnailUrl ?? _attachment!.url,
                  fit: BoxFit.cover,
                  width: double.infinity,
                  height: double.infinity,
                  placeholder: (context, url) => _buildPlaceholder(),
                  errorWidget: (context, url, error) {
                    WidgetsBinding.instance.addPostFrameCallback((_) {
                      if (mounted) setState(() => _imageError = true);
                    });
                    return _buildErrorPlaceholder();
                  },
                ),
        ),
      ),
    );
  }

  Widget _buildPlaceholder() {
    return Container(
      color: Theme.of(context).colorScheme.surfaceVariant,
      child: const Center(
        child: CircularProgressIndicator(),
      ),
    );
  }

  Widget _buildErrorPlaceholder() {
    return Container(
      width: 200,
      height: 200,
      color: Theme.of(context).colorScheme.surfaceVariant,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.broken_image,
            size: 48,
            color: Theme.of(context).colorScheme.onSurfaceVariant,
          ),
          const SizedBox(height: 8),
          Text(
            'Failed to load image',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                ),
          ),
        ],
      ),
    );
  }
}

class WibeVideoMessage extends StatefulWidget {
  final Message message;
  final bool isSentByMe;
  final VoidCallback? onTap;
  final VoidCallback? onLongPress;

  const WibeVideoMessage({
    super.key,
    required this.message,
    required this.isSentByMe,
    this.onTap,
    this.onLongPress,
  });

  @override
  State<WibeVideoMessage> createState() => _WibeVideoMessageState();
}

class _WibeVideoMessageState extends State<WibeVideoMessage> {
  MediaAttachment? _attachment;
  VideoPlayerController? _controller;
  bool _initialized = false;
  bool _showControls = true;

  @override
  void initState() {
    super.initState();
    _attachment = widget.message.attachments.isNotEmpty ? widget.message.attachments.first : null;
    if (_attachment != null) {
      _initializePlayer();
    }
  }

  Future<void> _initializePlayer() async {
    try {
      _controller = VideoPlayerController.networkUrl(Uri.parse(_attachment!.url));
      await _controller!.initialize();
      if (mounted) {
        setState(() => _initialized = true);
      }
    } catch (e) {
      debugPrint('Video player init error: $e');
    }
  }

  @override
  void dispose() {
    _controller?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_attachment == null) {
      return _buildErrorPlaceholder();
    }

    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return GestureDetector(
      onTap: widget.onTap,
      onLongPress: widget.onLongPress,
      onTapDown: (_) => setState(() => _showControls = true),
      child: Container(
        constraints: BoxConstraints(
          maxWidth: MediaQuery.of(context).size.width * 0.7,
          maxHeight: 400,
        ),
        decoration: BoxDecoration(
          color: widget.isSentByMe
              ? (isDark ? WibeColors.darkOutgoingBubble : WibeColors.lightOutgoingBubble)
              : (isDark ? WibeColors.darkIncomingBubble : WibeColors.lightIncomingBubble),
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(16),
            topRight: const Radius.circular(16),
            bottomLeft: widget.isSentByMe ? const Radius.circular(16) : const Radius.circular(4),
            bottomRight: widget.isSentByMe ? const Radius.circular(4) : const Radius.circular(16),
          ),
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(16),
            topRight: const Radius.circular(16),
            bottomLeft: widget.isSentByMe ? const Radius.circular(16) : const Radius.circular(4),
            bottomRight: widget.isSentByMe ? const Radius.circular(4) : const Radius.circular(16),
          ),
          child: Stack(
            fit: StackFit.expand,
            children: [
              if (_initialized && _controller != null)
                AspectRatio(
                  aspectRatio: _controller!.value.aspectRatio,
                  child: VideoPlayer(_controller!),
                )
              else
                _buildThumbnail(),
              if (_showControls && _initialized)
                _buildControls()
              else if (!_initialized)
                _buildPlayButton(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildThumbnail() {
    return CachedNetworkImage(
      imageUrl: _attachment!.thumbnailUrl ?? _attachment!.url,
      fit: BoxFit.cover,
      width: double.infinity,
      height: double.infinity,
      placeholder: (context, url) => Container(
        color: Theme.of(context).colorScheme.surfaceVariant,
        child: const Center(child: CircularProgressIndicator()),
      ),
      errorWidget: (context, url, error) => _buildErrorPlaceholder(),
    );
  }

  Widget _buildPlayButton() {
    return Center(
      child: Container(
        decoration: BoxDecoration(
          color: Colors.black.withOpacity(0.5),
          shape: BoxShape.circle,
        ),
        child: IconButton(
          icon: const Icon(Icons.play_arrow, color: Colors.white, size: 48),
          onPressed: () async {
            if (_controller != null && !_controller!.value.isPlaying) {
              await _controller!.play();
              setState(() {});
            }
          },
        ),
      ),
    );
  }

  Widget _buildControls() {
    return Positioned(
      bottom: 0,
      left: 0,
      right: 0,
      child: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.bottomCenter,
            end: Alignment.topCenter,
            colors: [
              Colors.black.withOpacity(0.8),
              Colors.transparent,
            ],
          ),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            VideoProgressIndicator(_controller!, allowScrubbing: true),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                IconButton(
                  icon: Icon(
                    _controller!.value.isPlaying ? Icons.pause : Icons.play_arrow,
                    color: Colors.white,
                    size: 32,
                  ),
                  onPressed: () {
                    setState(() {
                      if (_controller!.value.isPlaying) {
                        _controller!.pause();
                      } else {
                        _controller!.play();
                      }
                    });
                  },
                ),
                const SizedBox(width: 16),
                Text(
                  _formatDuration(_controller!.value.position),
                  style: const TextStyle(color: Colors.white),
                ),
                const Text(' / ', style: TextStyle(color: Colors.white)),
                Text(
                  _formatDuration(_controller!.value.duration),
                  style: const TextStyle(color: Colors.white),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildErrorPlaceholder() {
    return Container(
      width: 200,
      height: 200,
      color: Theme.of(context).colorScheme.surfaceVariant,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.videocam_off,
            size: 48,
            color: Theme.of(context).colorScheme.onSurfaceVariant,
          ),
          const SizedBox(height: 8),
          Text(
            'Failed to load video',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                ),
          ),
        ],
      ),
    );
  }

  String _formatDuration(Duration duration) {
    String twoDigits(int n) => n.toString().padLeft(2, '0');
    final minutes = twoDigits(duration.inMinutes.remainder(60));
    final seconds = twoDigits(duration.inSeconds.remainder(60));
    return '$minutes:$seconds';
  }
}

class WibeFileMessage extends StatelessWidget {
  final Message message;
  final bool isSentByMe;
  final VoidCallback? onTap;
  final VoidCallback? onLongPress;

  const WibeFileMessage({
    super.key,
    required this.message,
    required this.isSentByMe,
    this.onTap,
    this.onLongPress,
  });

  @override
  Widget build(BuildContext context) {
    final attachment = message.attachments.isNotEmpty ? message.attachments.first : null;
    if (attachment == null) return _buildErrorPlaceholder(context);

    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final icon = _getFileIcon(attachment.mimeType);
    final color = _getFileColor(attachment.mimeType);

    return GestureDetector(
      onTap: onTap,
      onLongPress: onLongPress,
      child: Container(
        constraints: const BoxConstraints(maxWidth: 280, minHeight: 80),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: widget.isSentByMe
              ? (isDark ? WibeColors.darkOutgoingBubble : WibeColors.lightOutgoingBubble)
              : (isDark ? WibeColors.darkIncomingBubble : WibeColors.lightIncomingBubble),
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(16),
            topRight: const Radius.circular(16),
            bottomLeft: widget.isSentByMe ? const Radius.circular(16) : const Radius.circular(4),
            bottomRight: widget.isSentByMe ? const Radius.circular(4) : const Radius.circular(16),
          ),
        ),
        child: Row(
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: color.withOpacity(0.2),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: color, size: 24),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    attachment.fileName ?? 'File',
                    style: theme.textTheme.titleSmall?.copyWith(
                          fontWeight: FontWeight.w600,
                          color: widget.isSentByMe
                              ? (isDark ? Colors.white : WibeColors.lightTextPrimary)
                              : (isDark ? WibeColors.darkTextPrimary : WibeColors.lightTextPrimary),
                        ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 2),
                  Text(
                    attachment.formattedSize,
                    style: theme.textTheme.bodySmall?.copyWith(
                          color: widget.isSentByMe
                              ? (isDark ? Colors.white70 : WibeColors.lightTextSecondary)
                              : (isDark ? WibeColors.darkTextSecondary : WibeColors.lightTextSecondary),
                        ),
                  ),
                ],
              ),
            ),
            Icon(
              Icons.chevron_right,
              color: widget.isSentByMe
                  ? (isDark ? Colors.white70 : WibeColors.lightTextSecondary)
                  : (isDark ? WibeColors.darkTextSecondary : WibeColors.lightTextSecondary),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildErrorPlaceholder(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      child: Text('Invalid file attachment', style: Theme.of(context).textTheme.bodyMedium),
    );
  }

  IconData _getFileIcon(String mimeType) {
    if (mimeType.startsWith('application/pdf')) return Icons.picture_as_pdf;
    if (mimeType.startsWith('application/msword') ||
        mimeType.contains('wordprocessingml')) return Icons.description;
    if (mimeType.startsWith('application/vnd.ms-excel') ||
        mimeType.contains('spreadsheetml')) return Icons.table_chart;
    if (mimeType.startsWith('application/vnd.ms-powerpoint') ||
        mimeType.contains('presentationml')) return Icons.slideshow;
    if (mimeType.startsWith('text/')) return Icons.text_snippet;
    if (mimeType.startsWith('application/zip') ||
        mimeType.startsWith('application/x-zip')) return Icons.folder_zip;
    return Icons.insert_drive_file;
  }

  Color _getFileColor(String mimeType) {
    if (mimeType.startsWith('application/pdf')) return Colors.red;
    if (mimeType.startsWith('application/msword') ||
        mimeType.contains('wordprocessingml')) return Colors.blue;
    if (mimeType.startsWith('application/vnd.ms-excel') ||
        mimeType.contains('spreadsheetml')) return Colors.green;
    if (mimeType.startsWith('application/vnd.ms-powerpoint') ||
        mimeType.contains('presentationml')) return Colors.orange;
    if (mimeType.startsWith('text/')) return Colors.grey;
    return WibeColors.primary;
  }
}

class WibeVoiceMessage extends StatefulWidget {
  final Message message;
  final bool isSentByMe;
  final VoidCallback? onTap;
  final VoidCallback? onLongPress;

  const WibeVoiceMessage({
    super.key,
    required this.message,
    required this.isSentByMe,
    this.onTap,
    this.onLongPress,
  });

  @override
  State<WibeVoiceMessage> createState() => _WibeVoiceMessageState();
}

class _WibeVoiceMessageState extends State<WibeVoiceMessage> with SingleTickerProviderStateMixin {
  MediaAttachment? _attachment;
  bool _isPlaying = false;
  double _progress = 0.0;
  Duration _duration = Duration.zero;
  Duration _position = Duration.zero;
  late AnimationController _waveAnimationController;

  @override
  void initState() {
    super.initState();
    _attachment = widget.message.attachments.isNotEmpty ? widget.message.attachments.first : null;
    _waveAnimationController = AnimationController(
      duration: const Duration(milliseconds: 800),
      vsync: this,
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _waveAnimationController.dispose();
    super.dispose();
  }

  void _togglePlay() {
    setState(() => _isPlaying = !_isPlaying);
    if (_isPlaying) {
      _waveAnimationController.repeat(reverse: true);
      // TODO: Implement actual audio playback
    } else {
      _waveAnimationController.stop();
      _waveAnimationController.reset();
      // TODO: Pause audio
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_attachment == null) return _buildErrorPlaceholder();

    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final waveform = _attachment!.waveform ?? _generateMockWaveform();

    return GestureDetector(
      onTap: widget.onTap,
      onLongPress: widget.onLongPress,
      onTapDown: (_) => _togglePlay(),
      child: Container(
        constraints: BoxConstraints(
          maxWidth: MediaQuery.of(context).size.width * 0.7,
          minHeight: 60,
        ),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: widget.isSentByMe
              ? (isDark ? WibeColors.darkOutgoingBubble : WibeColors.lightOutgoingBubble)
              : (isDark ? WibeColors.darkIncomingBubble : WibeColors.lightIncomingBubble),
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(16),
            topRight: const Radius.circular(16),
            bottomLeft: widget.isSentByMe ? const Radius.circular(16) : const Radius.circular(24),
            bottomRight: widget.isSentByMe ? const Radius.circular(24) : const Radius.circular(16),
          ),
        ),
        child: Row(
          children: [
            // Play/Pause button
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: widget.isSentByMe
                    ? (isDark ? WibeColors.primaryLight.withOpacity(0.3) : WibeColors.primary.withOpacity(0.2))
                    : (isDark ? WibeColors.darkSurface : WibeColors.lightSurface),
                shape: BoxShape.circle,
              ),
              child: IconButton(
                icon: Icon(
                  _isPlaying ? Icons.pause : Icons.play_arrow,
                  color: widget.isSentByMe
                      ? (isDark ? WibeColors.primaryLight : WibeColors.primary)
                      : (isDark ? WibeColors.primaryLight : WibeColors.primary),
                  size: 24,
                ),
                onPressed: _togglePlay,
              ),
            ),
            const SizedBox(width: 12),
            // Waveform
            Expanded(
              child: SizedBox(
                height: 44,
                child: _buildWaveform(waveform),
              ),
            ),
            const SizedBox(width: 12),
            // Duration
            Text(
              _attachment!.formattedDuration,
              style: theme.textTheme.bodySmall?.copyWith(
                color: widget.isSentByMe
                    ? (isDark ? Colors.white70 : WibeColors.lightTextSecondary)
                    : (isDark ? WibeColors.darkTextSecondary : WibeColors.lightTextSecondary),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildWaveform(List<double> waveform) {
    return AnimatedBuilder(
      animation: _waveAnimationController,
      builder: (context, child) {
        return Row(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: List.generate(waveform.length, (index) {
            final height = waveform[index] * 30 * (0.5 + _waveAnimationController.value * 0.5);
            return Container(
              width: 3,
              margin: const EdgeInsets.symmetric(horizontal: 1.5),
              height: height.clamp(4.0, 30.0),
              decoration: BoxDecoration(
                color: widget.isSentByMe
                    ? (Theme.of(context).brightness == Brightness.dark ? WibeColors.primaryLight : WibeColors.primary)
                    : (Theme.of(context).brightness == Brightness.dark ? WibeColors.primaryLight : WibeColors.primary),
                borderRadius: BorderRadius.circular(1.5),
              ),
            );
          }),
        );
      },
    );
  }

  Widget _buildErrorPlaceholder() {
    return Container(
      padding: const EdgeInsets.all(16),
      child: Text('Invalid voice message', style: Theme.of(context).textTheme.bodyMedium),
    );
  }

  List<double> _generateMockWaveform() {
    return List.generate(30, (index) => (index % 7 + 1) / 7.0);
  }
}