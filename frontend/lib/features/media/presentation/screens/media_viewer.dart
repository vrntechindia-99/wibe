import 'package:flutter/material.dart';
import 'package:photo_view/photo_view.dart';
import 'package:photo_view/photo_view_gallery.dart';
import 'package:video_player/video_player.dart';
import 'package:cached_network_image/cached_network_image.dart';

import '../../../../../core/constants/colors.dart';
import '../../../../../core/theme/app_theme.dart';
import '../../../../../domain/entities/media_attachment.dart';
import '../../../../../domain/entities/message.dart';

class WibeMediaViewer extends StatefulWidget {
  final List<MediaAttachment> mediaList;
  final int initialIndex;
  final String? conversationId;
  final String? currentUserId;

  const WibeMediaViewer({
    super.key,
    required this.mediaList,
    required this.initialIndex,
    this.conversationId,
    this.currentUserId,
  });

  @override
  State<WibeMediaViewer> createState() => _WibeMediaViewerState();
}

class _WibeMediaViewerState extends State<WibeMediaViewer> {
  late PageController _pageController;
  int _currentIndex = 0;
  final Map<int, VideoPlayerController> _videoControllers = {};
  bool _showAppBar = true;
  bool _showCaption = true;

  @override
  void initState() {
    super.initState();
    _currentIndex = widget.initialIndex;
    _pageController = PageController(initialPage: widget.initialIndex);
    _initializeVideoController(_currentIndex);
  }

  @override
  void dispose() {
    _pageController.dispose();
    for (final controller in _videoControllers.values) {
      controller.dispose();
    }
    super.dispose();
  }

  void _initializeVideoController(int index) {
    if (index >= widget.mediaList.length) return;
    final media = widget.mediaList[index];
    if (media.type == MediaType.video && !_videoControllers.containsKey(index)) {
      final controller = VideoPlayerController.networkUrl(Uri.parse(media.url));
      controller.initialize().then((_) {
        if (mounted) setState(() {});
        controller.setLooping(true);
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
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: Colors.black,
      extendBodyBehindAppBar: true,
      appBar: _showAppBar
          ? AppBar(
              backgroundColor: Colors.transparent,
              elevation: 0,
              leading: IconButton(
                icon: const Icon(Icons.close, color: Colors.white),
                onPressed: () => Navigator.pop(context),
              ),
              title: Text(
                '${_currentIndex + 1} / ${widget.mediaList.length}',
                style: const TextStyle(color: Colors.white),
              ),
              centerTitle: true,
              actions: [
                IconButton(
                  icon: const Icon(Icons.more_vert, color: Colors.white),
                  onPressed: _showMediaOptions,
                ),
              ],
            )
          : null,
      body: Stack(
        children: [
          PhotoViewGallery.builder(
            scrollPhysics: const BouncingScrollPhysics(),
            builder: (context, index) {
              final media = widget.mediaList[index];
              _initializeVideoController(index);

              return PhotoViewGalleryPageOptions.customChild(
                child: _buildMediaWidget(media, index),
                initialScale: PhotoViewComputedScale.contained,
                minScale: PhotoViewComputedScale.contained * 0.8,
                maxScale: PhotoViewComputedScale.covered * 2,
                heroAttributes: media.type == MediaType.image
                    ? PhotoViewHeroAttributes(tag: media.id)
                    : null,
              );
            },
            itemCount: widget.mediaList.length,
            loadingBuilder: (context, progress) => Center(
              child: CircularProgressIndicator(
                value: progress?.expectedTotalBytes != null
                    ? progress!.cumulativeBytesLoaded / progress.expectedTotalBytes!
                    : null,
                color: WibeColors.primary,
              ),
            ),
            pageController: _pageController,
            onPageChanged: (index) {
              _disposeVideoController(_currentIndex);
              setState(() => _currentIndex = index);
            },
            backgroundDecoration: const BoxDecoration(color: Colors.black),
          ),
          if (_showCaption && _hasCaption())
            Positioned(
              bottom: 0,
              left: 0,
              right: 0,
              child: Container(
                padding: const EdgeInsets.all(16),
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
                child: Text(
                  widget.mediaList[_currentIndex].fileName ?? '',
                  style: const TextStyle(color: Colors.white, fontSize: 16),
                  textAlign: TextAlign.center,
                ),
              ),
            ),
        ],
      ),
    );
  }

  bool _hasCaption() {
    if (_currentIndex >= widget.mediaList.length) return false;
    return widget.mediaList[_currentIndex].fileName != null &&
        widget.mediaList[_currentIndex].fileName!.isNotEmpty;
  }

  Widget _buildMediaWidget(MediaAttachment media, int index) {
    switch (media.type) {
      case MediaType.image:
        return _buildImageWidget(media);
      case MediaType.video:
        return _buildVideoWidget(media, index);
      case MediaType.document:
        return _buildDocumentWidget(media);
      case MediaType.audio:
        return _buildAudioWidget(media);
    }
  }

  Widget _buildImageWidget(MediaAttachment media) {
    return CachedNetworkImage(
      imageUrl: media.url,
      fit: BoxFit.contain,
      placeholder: (context, url) => const Center(
        child: CircularProgressIndicator(color: WibeColors.primary),
      ),
      errorWidget: (context, url, error) => const Center(
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

  Widget _buildVideoWidget(MediaAttachment media, int index) {
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

  Widget _buildDocumentWidget(MediaAttachment media) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            _getDocumentIcon(media.mimeType),
            size: 80,
            color: Colors.white,
          ),
          const SizedBox(height: 16),
          Text(
            media.fileName ?? 'Document',
            style: const TextStyle(color: Colors.white, fontSize: 18),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),
          Text(
            media.formattedSize,
            style: const TextStyle(color: Colors.white70, fontSize: 14),
          ),
        ],
      ),
    );
  }

  Widget _buildAudioWidget(MediaAttachment media) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 120,
            height: 120,
            decoration: BoxDecoration(
              color: WibeColors.primary.withOpacity(0.2),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.mic,
              size: 64,
              color: WibeColors.primary,
            ),
          ),
          const SizedBox(height: 16),
          Text(
            media.fileName ?? 'Voice Message',
            style: const TextStyle(color: Colors.white, fontSize: 18),
          ),
          const SizedBox(height: 8),
          Text(
            media.formattedDuration,
            style: const TextStyle(color: Colors.white70, fontSize: 14),
          ),
        ],
      ),
    );
  }

  IconData _getDocumentIcon(String mimeType) {
    if (mimeType.startsWith('application/pdf')) return Icons.picture_as_pdf;
    if (mimeType.contains('wordprocessingml')) return Icons.description;
    if (mimeType.contains('spreadsheetml')) return Icons.table_chart;
    if (mimeType.contains('presentationml')) return Icons.slideshow;
    if (mimeType.startsWith('text/')) return Icons.text_snippet;
    return Icons.insert_drive_file;
  }

  void _showMediaOptions() {
    final media = widget.mediaList[_currentIndex];
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
              leading: const Icon(Icons.download),
              title: const Text('Download'),
              onTap: () {
                Navigator.pop(context);
                _downloadMedia(media);
              },
            ),
            ListTile(
              leading: const Icon(Icons.share),
              title: const Text('Share'),
              onTap: () {
                Navigator.pop(context);
                _shareMedia(media);
              },
            ),
            if (media.type == MediaType.image || media.type == MediaType.video)
              ListTile(
                leading: const Icon(Icons.save_alt),
                title: const Text('Save to Gallery'),
                onTap: () {
                  Navigator.pop(context);
                  _saveToGallery(media);
                },
              ),
            ListTile(
              leading: Icon(Icons.info_outline, color: Theme.of(context).colorScheme.onSurface),
              title: const Text('Info'),
              onTap: () {
                Navigator.pop(context);
                _showMediaInfo(media);
              },
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }

  Future<void> _downloadMedia(MediaAttachment media) async {
    // TODO: Implement download
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Downloading ${media.fileName}...')),
      );
    }
  }

  Future<void> _shareMedia(MediaAttachment media) async {
    // TODO: Implement share
  }

  Future<void> _saveToGallery(MediaAttachment media) async {
    // TODO: Implement save to gallery
  }

  void _showMediaInfo(MediaAttachment media) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Media Info'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _InfoRow(label: 'Name', value: media.fileName ?? 'Unknown'),
            _InfoRow(label: 'Type', value: media.type.name.toUpperCase()),
            _InfoRow(label: 'Size', value: media.formattedSize),
            _InfoRow(label: 'MIME', value: media.mimeType),
            if (media.width != null && media.height != null)
              _InfoRow(label: 'Dimensions', value: '${media.width}x${media.height}'),
            if (media.duration != null)
              _InfoRow(label: 'Duration', value: media.formattedDuration),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final String label;
  final String value;

  const _InfoRow({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 100,
            child: Text(
              '$label:',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    fontWeight: FontWeight.w500,
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                  ),
            ),
          ),
          Expanded(
            child: Text(value, style: Theme.of(context).textTheme.bodyMedium),
          ),
        ],
      ),
    );
  }
}