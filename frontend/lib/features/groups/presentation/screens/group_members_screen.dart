import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../../core/constants/colors.dart';
import '../../../../../core/theme/app_theme.dart';
import '../../../../../presentation/shared/widgets/wibe_avatar.dart';
import '../../../../../presentation/shared/widgets/wibe_text_field.dart';
import '../../../../../domain/entities/group.dart'
import '../providers/group_providers.dart'

class GroupMembersScreen extends ConsumerStatefulWidget {
  final String groupId;
  final bool manageAdmins;

  const GroupMembersScreen({
    super.key,
    required this.groupId,
    this.manageAdmins = false,
  });

  @override
  ConsumerState<GroupMembersScreen> createState() => _GroupMembersScreenState();
}

class _GroupMembersScreenState extends ConsumerState<GroupMembersScreen> {
  final _searchController = TextEditingController();
  String _searchQuery = '';

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final groupAsync = ref.watch(groupDetailProvider(widget.groupId));
    final membersAsync = ref.watch(groupMembersProvider(widget.groupId));
    final currentUser = ref.watch(currentUserProvider);
    final group = groupAsync.value;

    return Scaffold(
      appBar: AppBar(
        title: Text(widget.manageAdmins ? 'Manage Admins' : 'Members'),
        actions: [
          if (widget.manageAdmins)
            IconButton(
              icon: const Icon(Icons.person_add),
              onPressed: () => _showAddAdminSheet(context),
            ),
        ],
      ),
      body: Column(
        children: [
          // Search
          Padding(
            padding: const EdgeInsets.all(16),
            child: WibeTextField(
              controller: _searchController,
              hint: 'Search members...',
              prefixIcon: const Icon(Icons.search),
              onChanged: (value) => setState(() => _searchQuery = value),
            ),
          ),
          // Members list
          Expanded(
            child: membersAsync.when(
              loading: () => _buildLoadingState(context),
              error: (error, stack) => _buildErrorState(context, error),
              data: (members) {
                final filteredMembers = _searchQuery.isEmpty
                    ? members
                    : members.where((m) =>
                        m.displayName.toLowerCase().contains(_searchQuery.toLowerCase())).toList();

                if (filteredMembers.isEmpty) {
                  return _buildEmptyState(context);
                }

                final currentUserId = ref.read(currentUserProvider)?.id;
                final group = ref.watch(groupDetailProvider(widget.groupId)).value;
                final isOwner = group?.isOwner ?? false;
                final isAdmin = group?.isAdmin ?? false;

                return ListView.builder(
                  itemCount: filteredMembers.length,
                  itemBuilder: (context, index) {
                    final member = filteredMembers[index];
                    final isCurrentUser = member.userId == currentUserId;
                    final canManage = widget.manageAdmins && (isOwner || (isAdmin && !member.isOwner));

                    return _buildMemberTile(context, member, isCurrentUser, canManage, isOwner);
                  },
                );
              },
            ),
        ],
      ),
    );
  }

  Widget _buildLoadingState(BuildContext context) {
    return ListView.builder(
      itemCount: 10,
      itemBuilder: (_, __) => _buildShimmerTile(context),
    );
  }

  Widget _buildShimmerTile(BuildContext context) {
    return ListTile(
      leading: CircleAvatar(
        radius: 24,
        backgroundColor: Theme.of(context).colorScheme.surfaceVariant,
      ),
      title: Container(height: 16, width: 120, color: Theme.of(context).colorScheme.surfaceVariant),
      subtitle: Container(height: 12, width: 80, color: Theme.of(context).colorScheme.surfaceVariant),
    );
  }

  Widget _buildErrorState(BuildContext context, Object error) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.error_outline, size: 64, color: WibeColors.error),
          const SizedBox(height: 16),
          Text('Failed to load members', style: Theme.of(context).textTheme.headlineSmall),
          const SizedBox(height: 8),
          Text(error.toString(), style: Theme.of(context).textTheme.bodySmall),
        ],
      ),
    );
  }

  Widget _buildEmptyState(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.group_outlined, size: 64, color: Theme.of(context).colorScheme.onSurfaceVariant),
          const SizedBox(height: 16),
          Text('No members found', style: Theme.of(context).textTheme.titleMedium?.copyWith(
                color: Theme.of(context).colorScheme.onSurfaceVariant,
              )),
        ],
      ),
    );
  }

  Widget _buildMemberTile(BuildContext context, GroupMember member, bool isCurrentUser, bool canManage, bool isOwner) {
    final theme = Theme.of(context);

    return ListTile(
      leading: WibeAvatar(
        imageUrl: member.avatarUrl,
        name: member.displayName,
        radius: 24,
      ),
      title: Row(
        children: [
          Expanded(
            child: Text(
              member.displayName,
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: isCurrentUser ? FontWeight.w600 : FontWeight.normal,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
          if (isCurrentUser)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
              decoration: BoxDecoration(
                color: theme.colorScheme.primaryContainer,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                'You',
                style: theme.textTheme.labelSmall?.copyWith(
                  color: theme.colorScheme.onPrimaryContainer,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
        ],
      ),
      subtitle: Row(
        children: [
          if (member.role != GroupRole.member) ...[
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                color: _getRoleColor(member.role).withOpacity(0.2),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                _getRoleText(member.role),
                style: theme.textTheme.labelSmall?.copyWith(
                  color: _getRoleColor(member.role),
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
            const SizedBox(width: 8),
          ],
          if (member.isMuted)
            Icon(Icons.mic_off, size: 14, color: theme.colorScheme.onSurfaceVariant),
        ],
      ),
      trailing: widget.manageAdmins && canManage && !isCurrentUser
          ? PopupMenuButton<String>(
              icon: Icon(Icons.more_vert, color: theme.colorScheme.onSurfaceVariant),
              onSelected: (value) => _handleMemberAction(value, member),
              itemBuilder: (context) => [
                if (member.role == GroupRole.member)
                  const PopupMenuItem(
                    value: 'promote',
                    child: Row(
                      children: [
                        Icon(Icons.admin_panel_settings, size: 18),
                        SizedBox(width: 8),
                        Text('Promote to Admin'),
                      ],
                    ),
                  ),
                if (member.role == GroupRole.admin)
                  const PopupMenuItem(
                    value: 'demote',
                    child: Row(
                      children: [
                        Icon(Icons.person_remove, size: 18),
                        SizedBox(width: 8),
                        Text('Demote to Member'),
                      ],
                    ),
                  ),
                const PopupMenuItem(
                  value: 'remove',
                  child: Row(
                    children: [
                      Icon(Icons.person_remove, size: 18, color: WibeColors.error),
                      SizedBox(width: 8),
                      Text('Remove', style: TextStyle(color: WibeColors.error)),
                    ],
                  ),
                ),
              ],
            )
          : (isOwner || isAdmin) && !isCurrentUser
              ? PopupMenuButton<String>(
                  icon: Icon(Icons.more_vert, color: theme.colorScheme.onSurfaceVariant),
                  onSelected: (value) => _handleMemberAction(value, member),
                  itemBuilder: (context) => [
                    const PopupMenuItem(
                      value: 'remove',
                      child: Row(
                        children: [
                          Icon(Icons.person_remove, size: 18, color: WibeColors.error),
                          SizedBox(width: 8),
                          Text('Remove', style: TextStyle(color: WibeColors.error)),
                        ],
                      ),
                    ),
                  ],
                )
              : null,
      onTap: () {
        if (!widget.manageAdmins) {
          // Navigate to user profile
        }
      },
    );
  }

  Color _getRoleColor(GroupRole role) {
    switch (role) {
      case GroupRole.owner:
        return WibeColors.warning;
      case GroupRole.admin:
        return WibeColors.primary;
      case GroupRole.member:
        return Colors.grey;
    }
  }

  String _getRoleText(GroupRole role) {
    switch (role) {
      case GroupRole.owner:
        return 'Owner';
      case GroupRole.admin:
        return 'Admin';
      case GroupRole.member:
        return 'Member';
    }
  }

  void _handleMemberAction(String action, GroupMember member) {
    switch (action) {
      case 'promote':
        ref.read(promoteAdminUseCaseProvider).execute(widget.groupId, member.userId);
        break;
      case 'demote':
        ref.read(demoteAdminUseCaseProvider).execute(widget.groupId, member.userId);
        break;
      case 'remove':
        _showRemoveConfirmation(member);
        break;
    }
  }

  void _showRemoveConfirmation(GroupMember member) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Remove ${member.displayName}?'),
        content: const Text('This user will be removed from the group. They can rejoin later if invited.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              ref.read(removeMemberUseCaseProvider).execute(widget.groupId, member.userId);
            },
            style: TextButton.styleFrom(foregroundColor: WibeColors.error),
            child: const Text('Remove'),
          ),
        ],
      ),
    );
  }
}