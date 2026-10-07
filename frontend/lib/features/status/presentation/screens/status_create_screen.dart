import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';

import '../../../../../core/constants/colors.dart';
import '../../../../../core/theme/app_theme.dart';
import '../../../../../presentation/shared/widgets/wibe_avatar.dart';
import '../../../../../presentation/shared/widgets/wibe_button.dart';
import '../../../../../presentation/shared/widgets/wibe_text_field.dart';
import '../../domain/entities/status.dart';

class StatusCreateScreen extends ConsumerStatefulWidget {
  const StatusCreateScreen({super.key});

  @override
  ConsumerState<StatusCreateScreen> createState() => _StatusCreateScreenState();
}

class _StatusCreateScreenState extends ConsumerState<StatusCreateScreen> {
  final _textController = TextEditingController();
  XFile? _selectedMedia;
  StatusType _statusType = StatusType.text;
  StatusPrivacy _privacy = StatusPrivacy.contacts;
  bool _isPosting = false;

  @override
  void dispose() {
    _textController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('New Status'),
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: _isPosting ? null : () => context.pop(),
        ),
        actions: [
          if (_statusType == StatusType.text)
            TextButton(
              onPressed: _isPosting ? null : _postTextStatus,
              child: _isPosting
                  ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
                  : const Text('Post'),
            ),
        ],
      ),
      body: Column(
        children: [
          // Type selector
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              border: Border(bottom: BorderSide(color: Theme.of(context).dividerColor)),
            ),
            child: Row(
              children: [
                _TypeButton(
                  type: StatusType.text,
                  selected: _statusType == StatusType.text,
                  onTap: () => setState(() => _statusType = StatusType.text),
                ),
                _TypeButton(
                  type: StatusType.image,
                  selected: _statusType == StatusType.image,
                  onTap: () => _pickMedia(ImageSource.gallery),
                ),
                _TypeButton(
                  type: StatusType.video,
                  selected: _statusType == StatusType.video,
                  onTap: () => _pickMedia(ImageSource.gallery),
                ),
              ],
            ),
          ),

          // Content area
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (_statusType == StatusType.text) ...[
                    Text(
                      'What\'s on your mind?',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: Theme.of(context).colorScheme.onSurfaceVariant,
                          ),
                    ),
                    const SizedBox(height: 16),
                    WibeTextField(
                      controller: _textController,
                      hint: 'Type your status...',
                      maxLines: 8,
                      maxLength: 500,
                      onChanged: (_) => setState(() {}),
                    ),
                  if (_selectedMedia != null) ...[
                    _buildMediaPreview(),
                    const SizedBox(height: 16),
                    WibeTextField(
                      controller: _textController,
                      hint: 'Add a caption...',
                      maxLines: 3,
                      maxLength: 500,
                    ),
                  ],
                ],
              ),
            ),
          ),

          // Privacy selector
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              border: Border(top: BorderSide(color: Theme.of(context).dividerColor)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Who can see this?',
                  style: Theme.of(context).textTheme.labelMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      _PrivacyButton(
                        privacy: StatusPrivacy.contacts,
                        selected: _privacy == StatusPrivacy.contacts,
                        onTap: () => setState(() => _privacy = StatusPrivacy.contacts),
                      ),
                      _PrivacyButton(
                        privacy: StatusPrivacy.contactsExcept,
                        selected: _privacy == StatusPrivacy.contactsExcept,
                        onTap: () => _showPrivacyOptions(),
                      ),
                      _PrivacyButton(
                        privacy: StatusPrivacy.selected,
                        selected: _privacy == StatusPrivacy.selected,
                        onTap: () => _showPrivacyOptions(),
                      ),
                    ],
                  ),
                ],
              ),
            ),

          // Post button
          if (_statusType != StatusType.text)
            Padding(
              padding: const EdgeInsets.all(16),
              child: WibeButton(
                text: 'Post Status',
                onPressed: _isPosting ? null : _postMediaStatus,
                isLoading: _isPosting,
                width: double.infinity,
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildMediaPreview() {
    if (_selectedMedia == null) return const SizedBox.shrink();

    return Stack(
      children: [
        ClipRRect(
          borderRadius: BorderRadius.circular(12),
          child: Image.file(
            File(_selectedMedia!.path),
            height: 200,
            width: double.infinity,
            fit: BoxFit.cover,
          ),
        ),
        Positioned(
          top: 8,
          right: 8,
          child: GestureDetector(
            onTap: () => setState(() => _selectedMedia = null),
            child: Container(
              padding: const EdgeInsets.all(4),
              decoration: BoxDecoration(
                color: Colors.black.withOpacity(0.6),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.close, size: 18, color: Colors.white),
            ),
          ),
        ],
      );
    }

  Future<void> _pickMedia(ImageSource source) async {
    final picker = ImagePicker();
    final media = await picker.pickVideo(source: source) ??
        await picker.pickImage(source: source, imageQuality: 80);

    if (media != null) {
      setState(() {
        _selectedMedia = media;
        _statusType = media.path.endsWith('.mp4') || media.path.endsWith('.mov')
            ? StatusType.video
            : StatusType.image;
      });
    }
  }

  Future<void> _postTextStatus() async {
    if (_textController.text.trim().isEmpty) return;

    setState(() => _isPosting = true);

    try {
      // TODO: Implement status creation API call
      await Future.delayed(const Duration(milliseconds: 500));
      if (mounted) context.pop(true);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to post: $e'), backgroundColor: WibeColors.error),
        );
      }
    } finally {
      if (mounted) setState(() => _isPosting = false);
    }
  }

  Future<void> _postMediaStatus() async {
    setState(() => _isPosting = true);

    try {
      // TODO: Implement media upload and status creation
      await Future.delayed(const Duration(milliseconds: 500));
      if (mounted) context.pop(true);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to post: $e'), backgroundColor: WibeColors.error),
        );
      }
    } finally {
      if (mounted) setState(() => _isPosting = false);
    }
  }

  void _showPrivacyOptions() {
    showModalBottomSheet(
      context: context,
      builder: (context) => SafeArea(
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
              leading: const Icon(Icons.people),
              title: const Text('My Contacts'),
              trailing: _privacy == StatusPrivacy.contacts ? const Icon(Icons.check, color: WibeColors.primary) : null,
              onTap: () {
                setState(() => _privacy = StatusPrivacy.contacts);
                Navigator.pop(context);
              },
            ),
            ListTile(
              leading: const Icon(Icons.person_remove),
              title: const Text('Contacts Except...'),
              trailing: _privacy == StatusPrivacy.contactsExcept ? const Icon(Icons.check, color: WibeColors.primary) : null,
              onTap: () {
                setState(() => _privacy = StatusPrivacy.contactsExcept);
                Navigator.pop(context);
                // TODO: Show contact selector for exceptions
              },
            ),
            ListTile(
              leading: const Icon(Icons.person_search),
              title: const Text('Selected Users...'),
              trailing: _privacy == StatusPrivacy.selected ? const Icon(Icons.check, color: WibeColors.primary) : null,
              onTap: () {
                setState(() => _privacy = StatusPrivacy.selected);
                Navigator.pop(context);
                // TODO: Show contact selector for selected users
              },
            ),
          ],
        ),
      ),
    );
  }
}

class _TypeButton extends StatelessWidget {
  final StatusType type;
  final bool selected;
  final VoidCallback onTap;

  const _TypeButton({
    required this.type,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    IconData icon;
    String label;
    switch (type) {
      case StatusType.text:
        icon = Icons.text_fields;
        label = 'Text';
        break;
      case StatusType.image:
        icon = Icons.photo_library;
        label = 'Photo';
        break;
      case StatusType.video:
        icon = Icons.videocam;
        label = 'Video';
        break;
    }

    return Expanded(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            color: selected
                ? theme.colorScheme.primary.withOpacity(0.1)
                : Colors.transparent,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: selected ? theme.colorScheme.primary : Colors.transparent,
              width: 2,
            ),
          ),
          child: Column(
            children: [
              Icon(
                icon,
                color: selected ? theme.colorScheme.primary : theme.colorScheme.onSurfaceVariant,
                size: 24,
              ),
              const SizedBox(height: 4),
              Text(
                label,
                style: TextStyle(
                  color: selected ? theme.colorScheme.primary : theme.colorScheme.onSurfaceVariant,
                  fontWeight: selected ? FontWeight.w600 : FontWeight.normal,
                  fontSize: 12,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _PrivacyButton extends StatelessWidget {
  final StatusPrivacy privacy;
  final bool selected;
  final VoidCallback onTap;

  const _PrivacyButton({
    required this.privacy,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    String label;
    IconData icon;
    switch (privacy) {
      case StatusPrivacy.contacts:
        icon = Icons.people;
        label = 'Contacts';
        break;
      case StatusPrivacy.contactsExcept:
        icon = Icons.person_remove;
        label = 'Except';
        break;
      case StatusPrivacy.selected:
        icon = Icons.person_search;
        label = 'Selected';
        break;
    }

    return Expanded(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            color: selected
                ? Theme.of(context).colorScheme.primary.withOpacity(0.1)
                : Colors.transparent,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: selected ? Theme.of(context).colorScheme.primary : Colors.transparent,
              width: 2,
            ),
          ),
          child: Column(
            children: [
              Icon(
                icon,
                color: selected ? Theme.of(context).colorScheme.primary : Theme.of(context).colorScheme.onSurfaceVariant,
                size: 20,
              ),
              const SizedBox(height: 4),
              Text(
                'My Contacts',
                style: TextStyle(
                  color: selected ? Theme.of(context).colorScheme.primary : Theme.of(context).colorScheme.onSurfaceVariant,
                  fontWeight: selected ? FontWeight.w600 : FontWeight.normal,
                  fontSize: 11,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}