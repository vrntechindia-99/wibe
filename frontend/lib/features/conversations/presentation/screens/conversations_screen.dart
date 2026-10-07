import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../../../core/constants/colors.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../presentation/shared/widgets/wibe_avatar.dart';
import '../../../../presentation/shared/widgets/wibe_text_field.dart';
import '../../../../presentation/shared/widgets/wibe_button.dart';
import '../../../../domain/entities/conversation.dart';
import '../../../../domain/entities/message.dart';
import '../providers/conversation_providers.dart';

class ConversationsScreen extends ConsumerStatefulWidget {
  const ConversationsScreen({super.key});

  @override
  ConsumerState<ConversationsScreen> createState() => _ConversationsScreenState();
}

class _ConversationsScreenState extends ConsumerState<ConversationsScreen> {
  final _searchController = TextEditingController();
  String _searchQuery = '';

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final filteredConversations = ref.watch(filteredConversationsProvider);

    return Scaffold(
      appBar: AppBar(
        title: _searchQuery.isEmpty
            ? const Text('Chats')
            : WibeTextField(
                controller: _searchController,
                hint: 'Search...',
                autofocus: true,
                onChanged: (value) {
                  setState(() => _searchQuery = value);
                  ref.read(searchQueryProvider.notifier).state = value;
                },
                prefixIcon: const Icon(Icons.search),
                suffixIcon: _searchQuery.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear),
                        onPressed: () {
                          _searchController.clear();
                          setState(() => _searchQuery = '');
                          ref.read(searchQueryProvider.notifier).state = '';
                        },
                      )
                    : null,
              ),
        actions: _searchQuery.isEmpty ? [
          IconButton(
            icon: const Icon(Icons.search),
            onPressed: () => setState(() {}),
          ),
          IconButton(
            icon: const Icon(Icons.more_vert),
            onPressed: () => _showMoreMenu(context),
          ),
        ] : null,
      ),
      body: filteredConversations.when(
        loading: () => _buildLoadingState(context),
        error: (error, stack) => _buildErrorState(context, error, () => ref.read(conversationsProvider.notifier).load()),
        data: (conversations) {
          if (conversations.isEmpty) {
            return _buildEmptyState(context);
          }

          final pinned = conversations.where((c) => c.isPinned).toList();
          final unpinned = conversations.where((c) => !c.isPinned).toList();

          return ListView(
            children: [
              if (pinned.isNotEmpty) ...[
                _buildSectionHeader(context, 'Pinned'),
                ...pinned.map((c) => _buildConversationTile(context, c, true)),
                Divider(height: 1, indent: 72, color: theme.dividerColor),
              ],
              if (unpinned.isNotEmpty) ...[
                ...unpinned.map((c) => _buildConversationTile(context, c, false)),
              ],
            ],
          );
        },
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showNewChatSheet(context),
        child: const Icon(Icons.chat_bubble_outline),
      ),
    );
  }

  Widget _buildLoadingState(BuildContext context) {
    return ListView.builder(
      itemCount: 8,
      itemBuilder: (_, __) => _buildShimmerTile(context),
    );
  }

  Widget _buildShimmerTile(BuildContext context) {
    return ListTile(
      leading: CircleAvatar(
        radius: 24,
        backgroundColor: Theme.of(context).colorScheme.surfaceVariant,
      ),
      title: Container(
        height: 16,
        width: 120,
        color: Theme.of(context).colorScheme.surfaceVariant,
        margin: const EdgeInsets.only(bottom: 4),
      ),
      subtitle: Container(
        height: 12,
        width: 180,
        color: Theme.of(context).colorScheme.surfaceVariant,
      ),
      trailing: Container(
        height: 12,
        width: 40,
        color: Theme.of(context).colorScheme.surfaceVariant,
      ),
    );
  }

  Widget _buildErrorState(BuildContext context, Object error, VoidCallback onRetry) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline, size: 64, color: WibeColors.error),
            const SizedBox(height: 16),
            Text(
              'Failed to load chats',
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 8),
            Text(
              error.toString(),
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                  ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            WibeButton(
              text: 'Retry',
              onPressed: onRetry,
              width: 120,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.chat_bubble_outline,
            size: 80,
            color: Theme.of(context).colorScheme.onSurfaceVariant.withOpacity(0.5),
          ),
          const SizedBox(height: 16),
          Text(
            'No chats yet',
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                ),
          ),
          const SizedBox(height: 8),
          Text(
            'Start a new conversation',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                ),
          ),
          const SizedBox(height: 24),
          WibeButton(
            text: 'New Chat',
            onPressed: () => _showNewChatSheet(context),
            width: 200,
          ),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(BuildContext context, String title) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
      child: Text(
        title.toUpperCase(),
        style: Theme.of(context).textTheme.labelSmall?.copyWith(
              color: Theme.of(context).colorScheme.onSurfaceVariant,
              letterSpacing: 1,
            ),
      ),
    );
  }

  Widget _buildConversationTile(BuildContext context, Conversation conversation, bool isPinned) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Dismissible(
      key: Key(conversation.id),
      background: _buildSwipeBackground(context, true),
      secondaryBackground: _buildSwipeBackground(context, false),
      confirmDismiss: (direction) async {
        if (direction == DismissDirection.startToEnd) {
          // Pin/Unpin
          if (isPinned) {
            await ref.read(unpinConversationUseCaseProvider).execute(conversation.id);
          } else {
            await ref.read(pinConversationUseCaseProvider).execute(conversation.id);
          }
        } else {
          // Archive/Mute/Delete
          return await _showConversationActions(context, conversation);
        }
        return false;
      },
      child: ListTile(
        leading: Stack(
          children: [
            WibeAvatar(
              imageUrl: conversation.getDisplayAvatar(''),
              name: conversation.getDisplayName(''),
              radius: 24,
            ),
            if (conversation.type == ConversationType.group)
              Positioned(
                bottom: 0,
                right: 0,
                child: Container(
                  padding: const EdgeInsets.all(2),
                  decoration: BoxDecoration(
                    color: theme.colorScheme.primary,
                    shape: BoxShape.circle,
                    border: Border.all(color: theme.colorScheme.surface, width: 2),
                  ),
                  child: Icon(
                    Icons.group,
                    size: 12,
                    color: theme.colorScheme.onPrimary,
                  ),
                ),
              ),
          ],
        ),
        title: Row(
          children: [
            Expanded(
              child: Text(
                conversation.getDisplayName(''),
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
            if (isPinned)
              Icon(Icons.push_pin, size: 16, color: theme.colorScheme.primary),
            if (conversation.isMuted)
              Icon(Icons.notifications_off, size: 16, color: theme.colorScheme.onSurfaceVariant),
          ],
        ),
        subtitle: _buildLastMessagePreview(context, conversation),
        trailing: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            if (conversation.lastMessage != null)
              Text(
                _formatTime(conversation.lastMessage!.createdAt),
                style: theme.textTheme.bodySmall?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
            if (conversation.unreadCount > 0) ...[
              const SizedBox(height: 4),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: theme.colorScheme.primary,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  conversation.unreadCount > 99 ? '99+' : conversation.unreadCount.toString(),
                  style: theme.textTheme.labelSmall?.copyWith(
                    color: theme.colorScheme.onPrimary,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ],
        ),
        onTap: () => context.push('/chat/${conversation.id}'),
        onLongPress: () => _showConversationActions(context, conversation),
      ),
    );
  }

  Widget _buildSwipeBackground(BuildContext context, bool isStart) {
    final theme = Theme.of(context);
    return Container(
      alignment: isStart ? Alignment.centerLeft : Alignment.centerRight,
      padding: const EdgeInsets.symmetric(horizontal: 20),
      color: isStart ? theme.colorScheme.primaryContainer : theme.colorScheme.errorContainer,
      child: Row(
        mainAxisAlignment: isStart ? MainAxisAlignment.start : MainAxisAlignment.end,
        children: [
          if (isStart)
            Icon(Icons.push_pin, color: theme.colorScheme.onPrimaryContainer),
          if (!isStart) ...[
            Icon(Icons.archive, color: theme.colorScheme.onErrorContainer),
            const SizedBox(width: 16),
            Icon(Icons.notifications_off, color: theme.colorScheme.onErrorContainer),
            const SizedBox(width: 16),
            Icon(Icons.delete_outline, color: theme.colorScheme.onErrorContainer),
          ],
        ],
      ),
    );
  }

  Widget _buildLastMessagePreview(BuildContext context, Conversation conversation) {
    final theme = Theme.of(context);
    final lastMessage = conversation.lastMessage;

    if (lastMessage == null) {
      return Text(
        'No messages yet',
        style: theme.textTheme.bodySmall?.copyWith(
          color: theme.colorScheme.onSurfaceVariant,
        ),
      );
    }

    final isSentByMe = lastMessage.senderId == 'current_user'; // TODO: Get actual user ID
    String preview = '';
    Widget? prefix;

    switch (lastMessage.type) {
      case MessageType.text:
        preview = lastMessage.content ?? '';
        break;
      case MessageType.image:
        preview = '📷 Photo';
        break;
      case MessageType.video:
        preview = '🎥 Video';
        break;
      case MessageType.document:
        preview = '📄 Document';
        break;
      case MessageType.audio:
        preview = '🎵 Audio';
        break;
      default:
        preview = lastMessage.content ?? '';
    }

    if (lastMessage.isDeleted) {
      preview = 'This message was deleted';
    } else if (lastMessage.isEdited) {
      preview = 'Edited: $preview';
    }

    if (isSentByMe) {
      prefix = _buildStatusIcon(lastMessage.status);
    }

    return Row(
      children: [
        if (prefix != null) ...[prefix, const SizedBox(width: 4)],
        Flexible(
          child: Text(
            preview,
            style: theme.textTheme.bodySmall?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }

  Widget? _buildStatusIcon(MessageStatus status) {
    switch (status) {
      case MessageStatus.sending:
        return SizedBox(
          width: 14,
          height: 14,
          child: CircularProgressIndicator(
            strokeWidth: 1.5,
            color: Theme.of(context).colorScheme.onSurfaceVariant,
          ),
        );
      case MessageStatus.sent:
        return Icon(Icons.check, size: 14, color: Theme.of(context).colorScheme.onSurfaceVariant);
      case MessageStatus.delivered:
        return Icon(Icons.done_all, size: 14, color: Theme.of(context).colorScheme.onSurfaceVariant);
      case MessageStatus.read:
        return Icon(
          Icons.done_all,
          size: 14,
          color: Theme.of(context).brightness == Brightness.dark
              ? WibeColors.primaryLight
              : WibeColors.primary,
        );
      case MessageStatus.failed:
        return Icon(Icons.error_outline, size: 14, color: WibeColors.error);
      default:
        return null;
    }
  }

  String _formatTime(DateTime dateTime) {
    final now = DateTime.now();
    final difference = now.difference(dateTime);

    if (difference.inDays > 0) {
      if (difference.inDays == 1) return 'Yesterday';
      if (difference.inDays < 7) return '${difference.inDays}d';
      return DateFormat('MMM d').format(dateTime);
    } else if (difference.inHours > 0) {
      return '${difference.inHours}h';
    } else if (difference.inMinutes > 0) {
      return '${difference.inMinutes}m';
    } else {
      return 'now';
    }
  }

  Future<bool> _showConversationActions(BuildContext context, Conversation conversation) async {
    final result = await showModalBottomSheet<bool>(
      context: context,
      builder: (context) => _ConversationActionsSheet(conversation: conversation),
    );
    return result ?? false;
  }

  void _showMoreMenu(BuildContext context) {
    showModalBottomSheet(
      context: context,
      builder: (context) => Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          ListTile(
            leading: const Icon(Icons.archive),
            title: const Text('Archived Chats'),
            onTap: () {
              Navigator.pop(context);
              // Navigate to archived chats
            },
          ),
          ListTile(
            leading: const Icon(Icons.settings),
            title: const Text('Settings'),
            onTap: () {
              Navigator.pop(context);
              context.push('/settings');
            },
          ),
        ],
      ),
    );
  }

  void _showNewChatSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (context) => _NewChatSheet(),
    );
  }
}

class _ConversationActionsSheet extends ConsumerWidget {
  final Conversation conversation;

  const _ConversationActionsSheet({required this.conversation});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);

    return SafeArea(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 40,
            height: 4,
            margin: const EdgeInsets.symmetric(vertical: 12),
            decoration: BoxDecoration(
              color: theme.colorScheme.onSurfaceVariant.withOpacity(0.3),
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          ListTile(
            leading: Icon(conversation.isPinned ? Icons.push_pin_outlined : Icons.push_pin),
            title: Text(conversation.isPinned ? 'Unpin' : 'Pin'),
            onTap: () async {
              Navigator.pop(context);
              if (conversation.isPinned) {
                await ref.read(unpinConversationUseCaseProvider).execute(conversation.id);
              } else {
                await ref.read(pinConversationUseCaseProvider).execute(conversation.id);
              }
            },
          ),
          ListTile(
            leading: Icon(conversation.isMuted ? Icons.notifications : Icons.notifications_off),
            title: Text(conversation.isMuted ? 'Unmute' : 'Mute'),
            onTap: () async {
              Navigator.pop(context);
              if (conversation.isMuted) {
                await ref.read(unmuteConversationUseCaseProvider).execute(conversation.id);
              } else {
                await _showMuteOptions(context, ref);
              }
            },
          ),
          ListTile(
            leading: Icon(conversation.isArchived ? Icons.unarchive : Icons.archive),
            title: Text(conversation.isArchived ? 'Unarchive' : 'Archive'),
            onTap: () async {
              Navigator.pop(context);
              if (conversation.isArchived) {
                await ref.read(unarchiveConversationUseCaseProvider).execute(conversation.id);
              } else {
                await ref.read(archiveConversationUseCaseProvider).execute(conversation.id);
              }
            },
          ),
          ListTile(
            leading: Icon(Icons.mark_chat_unread, color: theme.colorScheme.primary),
            title: const Text('Mark as unread'),
            onTap: () async {
              Navigator.pop(context);
              await ref.read(markUnreadUseCaseProvider).execute(conversation.id);
            },
          ),
          const Divider(),
          ListTile(
            leading: Icon(Icons.delete_outline, color: WibeColors.error),
            title: Text('Delete', style: TextStyle(color: WibeColors.error)),
            onTap: () async {
              Navigator.pop(context);
              await _confirmDelete(context, ref);
            },
          ),
        ],
      ),
    );
  }

  Future<void> _showMuteOptions(BuildContext context, WidgetRef ref) async {
    final options = [
      {'label': '8 hours', 'duration': 8 * 3600},
      {'label': '1 week', 'duration': 7 * 24 * 3600},
      {'label': 'Always', 'duration': null},
    ];

    await showModalBottomSheet(
      context: context,
      builder: (context) => Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const ListTile(title: Text('Mute for')),
          ...options.map((opt) => ListTile(
                title: Text(opt['label'] as String),
                onTap: () async {
                  Navigator.pop(context);
                  await ref.read(muteConversationUseCaseProvider).execute(
                    conversation.id,
                    duration: opt['duration'] as int?,
                  );
                },
              )),
        ],
      ),
    );
  }

  Future<void> _confirmDelete(BuildContext context, WidgetRef ref) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete chat?'),
        content: const Text('This will delete the chat from your device. The other person will still have it.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            style: TextButton.styleFrom(foregroundColor: WibeColors.error),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      await ref.read(conversationRepositoryProvider).deleteConversation(conversation.id);
    }
  }
}

class _NewChatSheet extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return DraggableScrollableSheet(
      initialChildSize: 0.6,
      maxChildSize: 0.9,
      minChildSize: 0.4,
      builder: (context, scrollController) => Container(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                margin: const EdgeInsets.only(bottom: 16),
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.onSurfaceVariant.withOpacity(0.3),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            Text(
              'New Chat',
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            WibeTextField(
              hint: 'Search contacts...',
              prefixIcon: const Icon(Icons.search),
              onChanged: (value) {
                // Search users
              },
            ),
            const SizedBox(height: 16),
            Expanded(
              child: ListView(
                children: [
                  ListTile(
                    leading: WibeAvatar(name: 'New Group', radius: 24, backgroundColor: WibeColors.primary),
                    title: const Text('New Group'),
                    onTap: () {
                      Navigator.pop(context);
                      // Navigate to group creation
                    },
                  ),
                  // Contact list would go here
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}