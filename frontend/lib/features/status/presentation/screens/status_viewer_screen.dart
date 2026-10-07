import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:photo_view/photo_view.dart'
import 'package:video_player/video_player.dart'

import '../../../../../core/constants/colors.dart'
import '../../../../../core/theme/app_theme.dart'
import '../../../../../presentation/shared/widgets/wibe_avatar.dart'
import '../../../../domain/entities/status.dart'
import '../providers/status_providers.dart'

class StatusViewerScreen extends ConsumerStatefulWidget {
  final List<Status> statuses;
  final int initialIndex;

  const StatusViewerScreen({
    super.key,
    required this.statuses,
    required this.initialIndex,
  });

  @override
  ConsumerState<StatusViewerScreen> createState() => _StatusViewerScreenState();
}

class _StatusViewerScreenState extends ConsumerState<StatusViewerScreen> {
  late PageController _pageController;
  int _currentIndex = 0;
  final Map<int, VideoPlayerController> _videoControllers = {};
  bool _showUI = true;
  Timer? _uiTimer;
  bool _showProgress = false;

  @override
  void initState() {
    super.initState();
    _currentIndex = widget.initialIndex;
    _pageController = PageController(initialPage: widget.initialIndex);
    _initializeVideoController(_currentIndex);
    _startUITimer();
    _markAsViewed();
  }

  @override
  void dispose() {
    _pageController.dispose();
    _uiTimer?.cancel();
    for (final controller in _videoControllers.values) {
      controller.dispose();
    }
    super.dispose();
  }

  void _startUITimer() {
    _uiTimer?.cancel();
    _uiTimer = Timer(const Duration(seconds: 3), () {
      if (mounted) setState(() => _showUI = false);
    });
  }

  void _markAsViewed() {
    if (_currentIndex < widget.statuses.length) {
      ref.read(statusServiceProvider).viewStatus(widget.statuses[_currentIndex].id);
    }
  }

  void _initializeVideoController(int index) {
    if (index >= widget.statuses.length) return;
    final status = widget.statuses[index];
    if (status.type == StatusType.video && !_videoControllers.containsKey(index)) {
      final controller = VideoPlayerController.networkUrl(Uri.parse(status.mediaUrl!));
      controller.initialize().then((_) {
        if (mounted) {
          setState(() {});
          controller.setLooping(true);
          if (_currentIndex == index) controller.play();
        }
      });
      _videoControllers[index] = controller;
    }
  }

  void _disposeVideoController(int index) {
    _videoControllers[index]?.dispose();
    _videoControllers.remove(index);
  }

  @override
  Widget build(BuildContext context) {
    if (widget.statuses.isEmpty) return const SizedBox.shrink();

    final status = widget.statuses[_currentIndex];
    final theme = Theme.of(context);

    return Scaffold(
      backgroundColor: Colors.black,
      extendBodyBehindAppBar: true,
      appBar: _showUI
          ? AppBar(
              backgroundColor: Colors.transparent,
              elevation: 0,
              leading: IconButton(
                icon: const Icon(Icons.close, color: Colors.white),
                onPressed: () => Navigator.pop(context),
              ),
              title: Text(
                status.userDisplayName ?? 'Status',
                style: const TextStyle(color: Colors.white),
              ),
              centerTitle: true,
              actions: [
                IconButton(
                  icon: const Icon(Icons.more_vert, color: Colors.white),
                  onPressed: () => _showOptions(status),
                ),
              ],
            )
          : null,
      body: Stack(
        children: [
          PageView.builder(
            controller: _pageController,
            itemCount: widget.statuses.length,
            onPageChanged: (index) {
              _disposeVideoController(_currentIndex);
              setState(() {
                _currentIndex = index;
                _showUI = true;
              });
              _startUITimer();
              _initializeVideoController(index);
              _markAsViewed();
            },
            itemBuilder: (context, index) {
              final status = widget.statuses[index];
              _initializeVideoController(index);
              return _buildStatusContent(status, index);
            },
          ),
          // Progress bar at top
          if (_showUI)
            Positioned(
              top: MediaQuery.of(context).padding.top + kToolbarHeight + 4,
              left: 12,
              right: 12,
              child: _buildProgressBars(),
            ),
          // Bottom UI
          if (_showUI)
            Positioned(
              bottom: 0,
              left: 0,
              right: 0,
              child: _buildBottomUI(widget.statuses[_currentIndex]),
            ),
        ],
      ),
    );
  }

  Widget _buildProgressBars() {
    return Row(
      children: widget.statuses.asMap().entries.map((entry) {
        final index = entry.key;
        final status = entry.value;
        final isViewed = index < _currentIndex;
        final isCurrent = index == _currentIndex;

        return Expanded(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 2),
            child: Stack(
              children: [
                Container(
                  height: 3,
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.4),
                    borderRadius: BorderRadius.circular(1.5),
                  ),
                ),
                if (isCurrent)
                  AnimatedContainer(
                    duration: const Duration(seconds: 1),
                    width: 100, // This would be animated in real implementation
                    height: 3,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(1.5),
                    ),
                  )
                else if (isViewed)
                  Container(
                    height: 3,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(1.5),
                    ),
                  ),
              ],
            ),
          ),
        );
      }).toList(),
    );
  }

  Widget _buildBottomUI(Status status) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.bottomCenter,
          end: Alignment.topCenter,
          colors: [
            Colors.black.withOpacity(0.8),
            Colors.transparent,
          ],
        ),
        child: SafeArea(
          top: false,
          child: Row(
            children: [
              WibeAvatar(
                imageUrl: status.userAvatarUrl,
                name: status.userDisplayName,
                radius: 18,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      status.userDisplayName ?? 'Unknown',
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w600,
                        fontSize: 16,
                      ),
                    ),
                    if (status.content != null && status.content!.isNotEmpty)
                      Text(
                        status.content!,
                        style: const TextStyle(color: Colors.white70, fontSize: 14),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                  ],
                ),
              ),
              // Reply/React buttons
              Row(
                children: [
                  IconButton(
                    icon: const Icon(Icons.reply, color: Colors.white, size: 24),
                    onPressed: () => _replyToStatus(widget.statuses[_currentIndex]),
                  ),
                  IconButton(
                    icon: const Icon(Icons.favorite_border, color: Colors.white, size: 24),
                    onPressed: () => _reactToStatus(widget.statuses[_currentIndex]),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatusContent(Status status, int index) {
    switch (status.type) {
      case StatusType.text:
        return _buildTextStatus(status);
      case StatusType.image:
        return _buildImageStatus(status);
      case StatusType.video:
        return _buildVideoStatus(status, index);
    }
  }

  Widget _buildTextStatus(Status status) {
    return Container(
      color: Colors.black,
      child: Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              if (status.content != null && status.content!.isNotEmpty)
                Text(
                  status.content!,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 28,
                    fontWeight: FontWeight.w500,
                    height: 1.4,
                  ),
                  textAlign: TextAlign.center,
                ),
              if (status.mediaUrl != null) ...[
                const SizedBox(height: 24),
                ClipRRect(
                  borderRadius: BorderRadius.circular(16),
                  child: Image.network(
                    status.mediaUrl!,
                    fit: BoxFit.contain,
                    maxWidth: 300,
                    maxHeight: 300,
                  ),
                ),
              ],
            ],
          ),
        ),
      );
    }

    Widget _buildImageStatus(Status status) {
      return PhotoView(
        imageProvider: NetworkImage(status.mediaUrl!),
        minScale: PhotoViewComputedScale.contained,
        maxScale: PhotoViewComputedScale.covered * 2,
        backgroundDecoration: const BoxDecoration(color: Colors.black),
        loadingBuilder: (context, event) => Center(
          child: CircularProgressIndicator(
            value: event?.expectedTotalBytes != null
                ? event!.cumulativeBytesLoaded / event.expectedTotalBytes!
                : null,
            color: WibeColors.primary,
          ),
        ),
        errorBuilder: (context, error, stack) => const Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.broken_image, color: Colors.white, size: 64),
              SizedBox(height: 16),
              Text('Failed to load image', style: TextStyle(color: Colors.white)),
            ],
          ),
        ),
      );
    }

    Widget _buildVideoStatus(Status status, int index) {
      final controller = _videoControllers[index];
      if (controller == null || !controller.value.isInitialized) {
        return const Center(child: CircularProgressIndicator(color: WibeColors.primary));
      }

      return Stack(
        alignment: Alignment.center,
        children: [
          AspectRatio(
            aspectRatio: controller.value.aspectRatio,
            child: VideoPlayer(controller),
          ),
          if (!controller.value.isPlaying)
            IconButton(
              icon: const Icon(Icons.play_arrow, color: Colors.white, size: 64),
              onPressed: () => controller.play(),
            ),
        ],
      );
    }

    void _showOptions(Status status) {
      showModalBottomSheet(
        context: context,
        backgroundColor: Colors.transparent,
        builder: (context) => Container(
          decoration: BoxDecoration(
            color: Theme.of(context).colorScheme.surface,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 40,
                height: 4,
                margin: const EdgeInsets.symmetric(vertical: 12),
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.onSurfaceVariant.withOpacity(0.3),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              ListTile(
                leading: const Icon(Icons.reply),
                title: const Text('Reply'),
                onTap: () {
                  Navigator.pop(context);
                  _replyToStatus(status);
                },
              ),
              ListTile(
                leading: const Icon(Icons.favorite_border),
                title: const Text('React'),
                onTap: () {
                  Navigator.pop(context);
                  _reactToStatus(status);
                },
              ),
              ListTile(
                leading: const Icon(Icons.share),
                title: const Text('Share'),
                onTap: () {
                  Navigator.pop(context);
                  _shareStatus(status);
                },
              ),
              if (status.userId == ref.read(currentUserProvider)?.id)
                ListTile(
                  leading: Icon(Icons.delete, color: WibeColors.error),
                  title: Text('Delete', style: TextStyle(color: WibeColors.error)),
                  onTap: () {
                    Navigator.pop(context);
                    _deleteStatus(status);
                  },
                ),
            ],
          ),
        ),
      );
    }

    void _replyToStatus(Status status) {
      // TODO: Navigate to reply screen
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Reply feature coming soon')),
      );
    }

    void _reactToStatus(Status status) {
      showModalBottomSheet(
        context: context,
        builder: (context) => _ReactionPicker(statusId: status.id),
      );
    }

    void _shareStatus(Status status) {
      // TODO: Implement share
    }

    void _deleteStatus(Status status) {
      showDialog(
        context: context,
        builder: (context) => AlertDialog(
          title: const Text('Delete Status?'),
          content: const Text('This action cannot be undone.'),
          actions: [
            TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
            TextButton(
              onPressed: () async {
                Navigator.pop(context);
                await ref.read(statusServiceProvider).deleteStatus(status.id);
                if (mounted) Navigator.pop(context);
              },
              style: TextButton.styleFrom(foregroundColor: WibeColors.error),
              child: const Text('Delete'),
            ),
          ],
        ),
      );
    }
  }
}

class _ReactionPicker extends ConsumerStatefulWidget {
  final String statusId;

  const _ReactionPicker({required this.statusId});

  @override
  ConsumerState<_ReactionPicker> createState() => _ReactionPickerState();
}

class _ReactionPickerState extends ConsumerState<_ReactionPicker> {
  static const emojis = ['❤️', '😂', '👍', '😮', '😢', '🔥'];

  @override
  Widget build(BuildContext context, WidgetRef ref) {
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
                color: Theme.of(context).colorScheme.onSurfaceVariant.withOpacity(0.3),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            Text('React to status', style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: emojis.map((emoji) {
                return InkWell(
                  onTap: () async {
                    await ref.read(statusServiceProvider).addReaction(widget.statusId, emoji);
                    if (mounted) Navigator.pop(context);
                  },
                  child: Container(
                    width: 56,
                    height: 56,
                    decoration: BoxDecoration(
                      color: Theme.of(context).colorScheme.surfaceVariant,
                      shape: BoxShape.circle,
                    ),
                    child: Center(
                      child: Text(emoji, style: const TextStyle(fontSize: 28)),
                    ),
                  ),
                );
              }).toList(),
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }
}