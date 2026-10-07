import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../../core/constants/colors.dart';
import '../../../../../core/theme/app_theme.dart';
import '../../../../../presentation/shared/widgets/wibe_avatar.dart';

class WibeReactionSummary extends ConsumerWidget {
  final String messageId;
  final Map<String, ReactionData> reactions;
  final Set<String> userReactions;
  final Function(String emoji) onReactionTap;
  final Function(String emoji) onLongPress;

  const WibeReactionSummary({
    super.key,
    required this.messageId,
    required this.reactions,
    required this.userReactions,
    required this.onReactionTap,
    required this.onLongPress,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    if (reactions.isEmpty) return const SizedBox.shrink();

    return Padding(
      padding: const EdgeInsets.only(top: 4, left: 8, right: 8, bottom: 4),
      child: Wrap(
        spacing: 6,
        runSpacing: 4,
        children: reactions.entries.map((entry) {
          final emoji = entry.key;
          final data = entry.value;
          final isReacted = userReactions.contains(emoji);

          return _ReactionChip(
            emoji: emoji,
            count: data.count,
            isReacted: isReacted,
            onTap: () => onReactionTap(emoji),
            onLongPress: () => onLongPress(emoji),
          );
        }).toList(),
      ),
    );
  }
}

class ReactionData {
  final int count;
  final List<String> userIds;

  ReactionData({required this.count, required this.userIds});
}

class _ReactionChip extends StatefulWidget {
  final String emoji;
  final int count;
  final bool isReacted;
  final VoidCallback onTap;
  final VoidCallback onLongPress;

  const _ReactionChip({
    required this.emoji,
    required this.count,
    required this.isReacted,
    required this.onTap,
    required this.onLongPress,
  });

  @override
  State<_ReactionChip> createState() => _ReactionChipState();
}

class _ReactionChipState extends State<_ReactionChip> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 200),
      vsync: this,
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _onTapDown(TapDownDetails details) {
    _controller.forward();
  }

  void _onTapUp(TapUpDetails details) {
    _controller.reverse();
    widget.onTap();
  }

  void _onTapCancel() {
    _controller.reverse();
  }

  void _onLongPress() {
    widget.onLongPress();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return GestureDetector(
      onTapDown: _onTapDown,
      onTapUp: _onTapUp,
      onTapCancel: _onTapCancel,
      onLongPress: _onLongPress,
      child: AnimatedScale(
        scale: widget.isReacted ? 1.05 : 1.0,
        duration: const Duration(milliseconds: 150),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
          decoration: BoxDecoration(
            color: widget.isReacted
                ? Theme.of(context).colorScheme.primary.withOpacity(0.2)
                : Theme.of(context).colorScheme.surfaceVariant,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: widget.isReacted
                  ? Theme.of(context).colorScheme.primary
                  : Colors.transparent,
              width: 1.5,
            ),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                widget.emoji,
                style: const TextStyle(fontSize: 16),
              ),
              if (widget.count > 1) ...[
                const SizedBox(width: 4),
                Text(
                  widget.count.toString(),
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: widget.isReacted
                        ? Theme.of(context).colorScheme.primary
                        : Theme.of(context).colorScheme.onSurfaceVariant,
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}