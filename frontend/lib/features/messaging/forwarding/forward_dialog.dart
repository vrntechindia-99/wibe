import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../../core/constants/colors.dart';
import '../../../../../core/theme/app_theme.dart';
import '../../../../../presentation/shared/widgets/wibe_avatar.dart';
import '../../../../../domain/entities/conversation.dart'
import '../../../../conversations/presentation/providers/conversation_providers.dart'
import '../providers/message_providers.dart'

class WibeForwardDialog extends ConsumerStatefulWidget {
  final Message message;
  final VoidCallback onClose;

  const WibeForwardDialog({
    super.key,
    required this.message,
    required this.onClose,
  });

  @override
  ConsumerState<WibeForwardDialog> createState() => _WibeForwardDialogState();
}

class _WibeForwardDialogState extends ConsumerState<WibeForwardDialog> {
  final _searchController = TextEditingController();
  String _searchQuery = '';
  final Set<String> _selectedConversationIds = {};

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final conversationsAsync = ref.watch(conversationsProvider);

    return AlertDialog(
      title: const Text('Forward Message'),
      content: SizedBox(
        width: double.maxFinite,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Message preview
            _buildMessagePreview(context),
            const Divider(),
            const SizedBox(height: 8),
            // Search
            WibeTextField(
              controller: _searchController,
              hint: 'Search chats...',
              prefixIcon: const Icon(Icons.search),
              onChanged: (value) => setState(() => _searchQuery = value),
            ),
            const SizedBox(height: 16),
            // Selected count
            if (_selectedConversationIds.isNotEmpty)
              Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Text(
                  '${_selectedConversationIds.length} chat(s) selected',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: Theme.of(context).colorScheme.primary,
                        fontWeight: FontWeight.w600,
                      ),
                ),
              ),
            // Conversations list
            Flexible(
              child: conversationsAsync.when(
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (error, _) => Text('Error: $error'),
                data: (conversations) {
                  final filtered = _searchQuery.isEmpty
                      ? conversations
                      : conversations.where((c) =>
                          c.getDisplayName('').toLowerCase().contains(_searchQuery.toLowerCase())).toList();

                  return ListView.builder(
                    shrinkWrap: true,
                    itemCount: filtered.length,
                    itemBuilder: (context, index) {
                      final conv = filtered[index];
                      final isSelected = _selectedConversationIds.contains(conv.id);

                      return ListTile(
                        leading: WibeAvatar(
                          imageUrl: conv.getDisplayAvatar(''),
                          name: conv.getDisplayName(''),
                          radius: 24,
                        ),
                        title: Text(conv.getDisplayName('')),
                        subtitle: conv.lastMessage != null
                            ? Text(
                                conv.lastMessage!.content ?? '',
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              )
                            : null,
                        trailing: isSelected
                            ? Icon(Icons.check_circle, color: WibeColors.primary)
                            : Icon(Icons.circle_outlined, color: Theme.of(context).colorScheme.onSurfaceVariant),
                        onTap: () {
                          setState(() {
                            if (isSelected) {
                              _selectedConversationIds.remove(conv.id);
                            } else {
                              _selectedConversationIds.add(conv.id);
                            }
                          });
                        },
                      );
                    },
                  ),
                ),
            ),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('Cancel'),
        ),
        if (_selectedConversationIds.isNotEmpty)
          ElevatedButton(
            onPressed: _isForwarding ? null : _forwardMessage,
            child: _isForwarding
                ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
                : Text('Forward (${_selectedConversationIds.length})'),
          ),
      ],
    );
  }

  Widget _buildMessagePreview(BuildContext context) {
    final theme = Theme.of(context);
    final message = widget.message;

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: theme.colorScheme.surfaceVariant,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              WibeAvatar(name: 'You', radius: 16),
              const SizedBox(width: 8),
              Text('You', style: theme.textTheme.labelMedium?.copyWith(fontWeight: FontWeight.w600)),
            ],
          ),
          const SizedBox(height: 8),
          _buildContentPreview(context, message),
        ],
      );
    }

    Widget _buildContentPreview(BuildContext context, Message message) {
      if (message.isDeleted) {
        return Text('This message was deleted', style: Theme.of(context).textTheme.bodyMedium);
      }

      switch (message.type) {
        case MessageType.text:
          return Text(message.content ?? '', style: Theme.of(context).textTheme.bodyMedium);
        case MessageType.image:
          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (message.attachments.isNotEmpty)
                ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: Image.network(
                    message.attachments.first.thumbnailUrl ?? message.attachments.first.url,
                    height: 120,
                    width: double.infinity,
                    fit: BoxFit.cover,
                  ),
                ),
              if (message.content != null && message.content!.isNotEmpty) ...[
                const SizedBox(height: 8),
                Text(message.content!, style: Theme.of(context).textTheme.bodyMedium),
              ],
            ],
          );
        case MessageType.video:
          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (message.attachments.isNotEmpty)
                Stack(
                  alignment: Alignment.center,
                  children: [
                    ClipRRect(
                      borderRadius: BorderRadius.circular(8),
                      child: Image.network(
                        message.attachments.first.thumbnailUrl ?? '',
                        height: 120,
                        width: double.infinity,
                        fit: BoxFit.cover,
                      ),
                    ),
                    const Icon(Icons.play_circle_fill, size: 48, color: Colors.white),
                  ],
                ),
              if (message.content != null) ...[
                const SizedBox(height: 8),
                Text(message.content!, style: Theme.of(context).textTheme.bodyMedium),
              ],
            ],
          );
        case MessageType.document:
          return ListTile(
            leading: Icon(Icons.insert_drive_file, color: Theme.of(context).colorScheme.primary),
            title: Text(message.content ?? message.attachments.first.fileName ?? 'Document'),
            subtitle: Text(message.attachments.first.formattedSize),
            contentPadding: EdgeInsets.zero,
          );
        case MessageType.audio:
          return Row(
            children: [
              Icon(Icons.mic, color: Theme.of(context).colorScheme.primary),
              const SizedBox(width: 8),
              Expanded(child: Text('Voice message', style: Theme.of(context).textTheme.bodyMedium)),
              Text(message.formattedDuration, style: Theme.of(context).textTheme.bodySmall),
            ],
          );
        default:
          return Text(message.content ?? '');
      }
    }

  bool _isForwarding = false;

  Future<void> _forwardMessage() async {
    setState(() => _isForwarding = true);

    try {
      await ref.read(sendMessageUseCaseProvider).execute(/* TODO: implement forward */);
      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Message forwarded')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to forward: $e'), backgroundColor: WibeColors.error),
        );
      }
    } finally {
      if (mounted) setState(() => _isForwarding = false);
    }
  }
}