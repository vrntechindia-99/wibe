import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:uuid/uuid.dart';

import '../../../../core/constants/colors.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../presentation/shared/widgets/wibe_avatar.dart';
import '../../../../presentation/shared/widgets/wibe_text_field.dart';
import '../../../../presentation/shared/widgets/wibe_button.dart';
import '../../../../domain/entities/message.dart';
import '../../../../domain/entities/conversation.dart';
import '../providers/message_providers.dart';
import '../../conversations/presentation/providers/conversation_providers.dart';
import '../../realtime/data/websocket_service.dart';

class ChatScreen extends ConsumerStatefulWidget {
  final String conversationId;

  const ChatScreen({super.key, required this.conversationId});

  @override
  ConsumerState<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends ConsumerState<ChatScreen> {
  final _scrollController = ScrollController();
  final _messageController = TextEditingController();
  final _focusNode = FocusNode();
  Timer? _typingTimer;
  bool _isTyping = false;
  bool _showScrollToBottom = false;

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
    _focusNode.addListener(_onFocusChange);
    _markAsRead();
  }

  @override
  void dispose() {
    _scrollController.dispose();
    _messageController.dispose();
    _focusNode.dispose();
    _typingTimer?.cancel();
    if (_isTyping) {
      _sendTypingStopped();
    }
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.offset < 100 && !_isLoadingMore) {
      _loadMoreMessages();
    }

    setState(() {
      _showScrollToBottom = _scrollController.offset > 300;
    });
  }

  bool _isLoadingMore = false;
  Future<void> _loadMoreMessages() async {
    if (_isLoadingMore) return;
    _isLoadingMore = true;
    // TODO: Implement pagination
    _isLoadingMore = false;
  }

  void _onFocusChange() {
    if (!_focusNode.hasFocus && _isTyping) {
      _sendTypingStopped();
    }
  }

  Future<void> _markAsRead() async {
    final messages = ref.read(messagesProvider(widget.conversationId)).valueOrNull;
    if (messages != null && messages.isNotEmpty) {
      final lastMessage = messages.first;
      // Mark as read via API
      // await ref.read(conversationRepositoryProvider).markAsRead(widget.conversationId, lastMessage.id);
    }
  }

  Future<void> _sendMessage() async {
    final content = _messageController.text.trim();
    if (content.isEmpty) return;

    final clientMessageId = const Uuid().v4();
    final message = Message(
      id: '',
      clientMessageId: clientMessageId,
      conversationId: widget.conversationId,
      senderId: 'current_user', // TODO: Get from auth
      type: MessageType.text,
      content: content,
      status: MessageStatus.sending,
      isEdited: false,
      isDeleted: false,
      deletedForEveryone: false,
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
    );

    _messageController.clear();
    _sendTypingStopped();

    // Optimistic update
    ref.read(messagesProvider(widget.conversationId).notifier).addMessage(message);

    try {
      await ref.read(sendMessageUseCaseProvider).execute(message);
    } catch (e) {
      // Update status to failed
      ref.read(messagesProvider(widget.conversationId).notifier).updateMessageStatus(clientMessageId, MessageStatus.failed);
    }
  }

  Future<void> _sendTypingStarted() async {
    if (_isTyping) return;
    _isTyping = true;
    // await ref.read(realtimeServiceProvider).sendTypingStarted(widget.conversationId);
  }

  Future<void> _sendTypingStopped() async {
    if (!_isTyping) return;
    _isTyping = false;
    _typingTimer?.cancel();
    // await ref.read(realtimeServiceProvider).sendTypingStopped(widget.conversationId);
  }

  void _onMessageChanged(String text) {
    _sendTypingStarted();
    _typingTimer?.cancel();
    _typingTimer = Timer(const Duration(seconds: 2), () {
      _sendTypingStopped();
    });
  }

  void _scrollToBottom() {
    if (_scrollController.hasClients) {
      _scrollController.animateTo(
        0,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeOut,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final messagesAsync = ref.watch(messagesProvider(widget.conversationId));
    final conversationAsync = ref.watch(conversationsProvider); // This won't work directly, need separate provider
    final typingUsers = ref.watch(typingUsersProvider);
    final replyingTo = ref.watch(replyingToProvider);

    return Scaffold(
      appBar: _buildAppBar(context),
      body: Column(
        children: [
          // Messages list
          Expanded(
            child: messagesAsync.when(
              loading: () => _buildLoadingState(context),
              error: (error, stack) => _buildErrorState(context, error),
              data: (messages) => _buildMessageList(context, messages, typingUsers),
            ),
          ),
          // Typing indicator
          if (typingUsers[widget.conversationId]?.isNotEmpty == true)
            _buildTypingIndicator(typingUsers[widget.conversationId]!),
          // Reply preview
          if (replyingTo != null) _buildReplyPreview(replyingTo),
          // Composer
          _buildComposer(context),
        ],
      ),
    );
  }

  PreferredSizeWidget _buildAppBar(BuildContext context) {
    return AppBar(
      title: Row(
        children: [
          WibeAvatar(
            imageUrl: '', // TODO: Get from conversation
            name: 'Contact Name',
            radius: 18,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Contact Name',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                  overflow: TextOverflow.ellipsis,
                ),
                Text(
                  'online', // TODO: Get from presence
                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                        color: WibeColors.success,
                      ),
                ),
              ],
            ),
          ),
        ],
      ),
      actions: [
        IconButton(
          icon: const Icon(Icons.call),
          onPressed: () {
            // Voice call
          },
        ),
        IconButton(
          icon: const Icon(Icons.videocam),
          onPressed: () {
            // Video call
          },
        ),
        IconButton(
          icon: const Icon(Icons.more_vert),
          onPressed: () => _showChatMenu(context),
        ),
      ],
    );
  }

  Widget _buildLoadingState(BuildContext context) {
    return ListView.builder(
      reverse: true,
      itemCount: 10,
      itemBuilder: (_, __) => _buildShimmerMessage(context),
    );
  }

  Widget _buildShimmerMessage(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.end,
        children: [
          Container(
            width: 200,
            height: 40,
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.surfaceVariant,
              borderRadius: BorderRadius.circular(12),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildErrorState(BuildContext context, Object error) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.error_outline, size: 64, color: WibeColors.error),
          const SizedBox(height: 16),
          Text('Failed to load messages', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 8),
          Text(error.toString(), style: Theme.of(context).textTheme.bodySmall),
          const SizedBox(height: 16),
          WibeButton(text: 'Retry', onPressed: () => ref.invalidate(messagesProvider(widget.conversationId)), width: 120),
        ],
      ),
    );
  }

  Widget _buildMessageList(BuildContext context, List<Message> messages, Map<String, Set<String>> typingUsers) {
    if (messages.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.chat_bubble_outline, size: 64, color: Theme.of(context).colorScheme.onSurfaceVariant.withOpacity(0.5)),
            const SizedBox(height: 16),
            Text('No messages yet', style: Theme.of(context).textTheme.titleMedium?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant)),
            const SizedBox(height: 8),
            Text('Start the conversation!', style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant)),
          ],
        ),
      );
    }

    return ListView.builder(
      controller: _scrollController,
      reverse: true,
      padding: const EdgeInsets.symmetric(vertical: 8),
      itemCount: messages.length,
      itemBuilder: (context, index) {
        final message = messages[index];
        final isSentByMe = message.senderId == 'current_user'; // TODO: Get actual user ID
        final showDate = index == 0 || _isDifferentDay(messages[index - 1].createdAt, message.createdAt);

        return Column(
          children: [
            if (showDate) _buildDateHeader(message.createdAt),
            _buildMessageBubble(context, message, isSentByMe),
          ],
        );
      },
    );
  }

  bool _isDifferentDay(DateTime a, DateTime b) {
    return a.year != b.year || a.month != b.month || a.day != b.day;
  }

  Widget _buildDateHeader(DateTime date) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final messageDay = DateTime(date.year, date.month, date.day);
    final yesterday = today.subtract(const Duration(days: 1));

    String label;
    if (messageDay == today) {
      label = 'Today';
    } else if (messageDay == yesterday) {
      label = 'Yesterday';
    } else {
      label = DateFormat('MMMM d, yyyy').format(date);
    }

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 16),
      child: Center(
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
          decoration: BoxDecoration(
            color: Theme.of(context).colorScheme.surfaceVariant,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Text(
            label,
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                ),
          ),
        ),
      ),
    );
  }

  Widget _buildMessageBubble(BuildContext context, Message message, bool isSentByMe) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final bubbleColor = isSentByMe
        ? (isDark ? WibeColors.darkOutgoingBubble : WibeColors.lightOutgoingBubble)
        : (isDark ? WibeColors.darkIncomingBubble : WibeColors.lightIncomingBubble);
    final textColor = isSentByMe
        ? Colors.white
        : (isDark ? WibeColors.darkTextPrimary : WibeColors.lightTextPrimary);

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      child: Row(
        mainAxisAlignment: isSentByMe ? MainAxisAlignment.end : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          if (!isSentByMe) ...[
            WibeAvatar(name: 'Other', radius: 16),
            const SizedBox(width: 8),
          ],
          Flexible(
            child: Column(
              crossAxisAlignment: isSentByMe ? CrossAxisAlignment.end : CrossAxisAlignment.start,
              children: [
                if (!isSentByMe)
                  Padding(
                    padding: const EdgeInsets.only(left: 12, bottom: 2),
                    child: Text(
                      'Contact Name', // TODO: Get actual name
                      style: theme.textTheme.labelSmall?.copyWith(
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                    ),
                  ),
                Container(
                  constraints: BoxConstraints(
                    maxWidth: MediaQuery.of(context).size.width * 0.75,
                  ),
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    color: bubbleColor,
                    borderRadius: BorderRadius.only(
                      topLeft: const Radius.circular(16),
                      topRight: const Radius.circular(16),
                      bottomLeft: isSentByMe ? const Radius.circular(16) : const Radius.circular(4),
                      bottomRight: isSentByMe ? const Radius.circular(4) : const Radius.circular(16),
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (message.replyToId != null)
                        _buildReplyPreview(message),
                      if (message.isDeleted)
                        Text(
                          'This message was deleted',
                          style: TextStyle(
                            color: textColor.withOpacity(0.7),
                            fontStyle: FontStyle.italic,
                          ),
                        )
                      else
                        Text(
                          message.content ?? '',
                          style: TextStyle(color: textColor, fontSize: 16),
                        ),
                      if (message.isEdited)
                        Padding(
                          padding: const EdgeInsets.only(top: 4),
                          child: Text(
                            'Edited',
                            style: TextStyle(
                              color: textColor.withOpacity(0.6),
                              fontSize: 11,
                              fontStyle: FontStyle.italic,
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.only(top: 2, left: 12, right: 12),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        DateFormat('HH:mm').format(message.createdAt),
                        style: TextStyle(
                          color: textColor.withOpacity(0.6),
                          fontSize: 11,
                        ),
                      ),
                      if (isSentByMe) ...[
                        const SizedBox(width: 4),
                        _buildStatusIcon(message.status),
                      ],
                    ],
                  ),
                ),
              ],
            ),
          ),
          if (isSentByMe) ...[
            const SizedBox(width: 8),
            CircleAvatar(
              radius: 16,
              backgroundColor: theme.colorScheme.primary,
              child: Text(
                'U',
                style: TextStyle(color: theme.colorScheme.onPrimary, fontSize: 12),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildReplyPreview(Message message) {
    // This is for showing reply preview in the bubble
    return Container(
      padding: const EdgeInsets.all(8),
      margin: const EdgeInsets.only(bottom: 4),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border(left: BorderSide(color: Theme.of(context).colorScheme.primary, width: 3)),
      ),
      child: Text(
        message.content ?? '',
        style: TextStyle(fontSize: 13, color: Colors.white.withOpacity(0.8)),
        maxLines: 2,
        overflow: TextOverflow.ellipsis,
      ),
    );
  }

  Widget _buildStatusIcon(MessageStatus status) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    switch (status) {
      case MessageStatus.sending:
        return SizedBox(
          width: 14,
          height: 14,
          child: CircularProgressIndicator(strokeWidth: 1.5, color: isDark ? WibeColors.primaryLight : WibeColors.primary),
        );
      case MessageStatus.sent:
        return Icon(Icons.check, size: 14, color: Colors.white.withOpacity(0.7));
      case MessageStatus.delivered:
        return Icon(Icons.done_all, size: 14, color: Colors.white.withOpacity(0.7));
      case MessageStatus.read:
        return Icon(Icons.done_all, size: 14, color: isDark ? WibeColors.primaryLight : WibeColors.primary);
      case MessageStatus.failed:
        return GestureDetector(
          onTap: () {
            // Retry
          },
          child: Icon(Icons.error_outline, size: 14, color: WibeColors.error),
        );
      default:
        return const SizedBox.shrink();
    }
  }

  Widget _buildTypingIndicator(Set<String> typingUserIds) {
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      child: Row(
        children: [
          SizedBox(
            width: 40,
            child: Center(
              child: _buildTypingAnimation(),
            ),
          ),
          Text(
            'typing...',
            style: theme.textTheme.bodySmall?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTypingAnimation() {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: List.generate(3, (index) {
        return AnimatedContainer(
          duration: const Duration(milliseconds: 600),
          margin: const EdgeInsets.symmetric(horizontal: 2),
          width: 6,
          height: 6,
          decoration: BoxDecoration(
            color: WibeColors.primary.withOpacity(0.5),
            shape: BoxShape.circle,
          ),
        );
      }),
    );
  }

  Widget _buildReplyPreview(Message message) {
    return Container(
      padding: const EdgeInsets.all(12),
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surfaceVariant,
        borderRadius: BorderRadius.circular(12),
        border: Border(left: BorderSide(color: Theme.of(context).colorScheme.primary, width: 3)),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Replying to',
                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                        color: Theme.of(context).colorScheme.primary,
                      ),
                ),
                const SizedBox(height: 2),
                Text(
                  message.content ?? '',
                  style: Theme.of(context).textTheme.bodyMedium,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          IconButton(
            icon: const Icon(Icons.close),
            onPressed: () {
              ref.read(replyingToProvider.notifier).state = null;
            },
          ),
        ],
      ),
    );
  }

  Widget _buildComposer(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        border: Border(top: BorderSide(color: Theme.of(context).dividerColor)),
      ),
      child: Row(
        children: [
          IconButton(
            icon: const Icon(Icons.attach_file),
            onPressed: () {
              // Attach file
            },
          ),
          Expanded(
            child: TextField(
              controller: _messageController,
              focusNode: _focusNode,
              decoration: InputDecoration(
                hintText: 'Message',
                border: InputBorder.none,
                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              ),
              maxLines: null,
              textCapitalization: TextCapitalization.sentences,
              onChanged: _onMessageChanged,
              onSubmitted: (_) => _sendMessage(),
            ),
          ),
          IconButton(
            icon: const Icon(Icons.mic),
            onPressed: () {
              // Voice message
            },
          ),
          WibeButton(
            text: '',
            icon: Icons.send,
            onPressed: _sendMessage,
            isLoading: false,
          ),
        ],
      ),
    );
  }

  void _showChatMenu(BuildContext context) {
    showModalBottomSheet(
      context: context,
      builder: (context) => Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          ListTile(
            leading: const Icon(Icons.search),
            title: const Text('Search in chat'),
            onTap: () {
              Navigator.pop(context);
              // TODO: Implement search in chat
            },
          ),
          ListTile(
            leading: const Icon(Icons.star_border),
            title: const Text('Starred messages'),
            onTap: () {
              Navigator.pop(context);
              // TODO: Implement starred messages
            },
          ),
          ListTile(
            leading: const Icon(Icons.block),
            title: const Text('Block'),
            onTap: () {
              Navigator.pop(context);
              // TODO: Implement block
            },
          ),
          ListTile(
            leading: const Icon(Icons.flag),
            title: const Text('Report'),
            onTap: () {
              Navigator.pop(context);
              // TODO: Implement report
            },
          ),
        ],
      ),
    );
  }
}