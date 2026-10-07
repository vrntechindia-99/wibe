import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../../core/constants/colors.dart';
import '../../../../../core/theme/app_theme.dart';
import '../../../../../presentation/shared/widgets/wibe_avatar.dart';
import '../../../../../presentation/shared/widgets/wibe_button.dart';
import '../../../../../presentation/shared/widgets/wibe_text_field.dart';
import '../../../../../domain/entities/group.dart';
import '../providers/group_providers.dart';
import 'group_members_screen.dart';
import 'group_settings_screen.dart';

class GroupInfoScreen extends ConsumerWidget {
  final String groupId;

  const GroupInfoScreen({super.key, required this.groupId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final groupAsync = ref.watch(groupDetailProvider(groupId));
    final currentUser = ref.watch(currentUserProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Group Info'),
        actions: [
          IconButton(
            icon: const Icon(Icons.more_vert),
            onPressed: () => _showMoreOptions(context, ref),
          ),
        ],
      ),
      body: groupAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) => _buildErrorState(context, error),
        data: (group) {
          if (group == null) return _buildErrorState(context, 'Group not found');
          return _buildGroupInfo(context, ref, group, currentUser);
        },
      ),
    );
  }

  Widget _buildErrorState(BuildContext context, Object error) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline, size: 64, color: WibeColors.error),
            const SizedBox(height: 16),
            Text('Failed to load group', style: Theme.of(context).textTheme.headlineSmall),
            const SizedBox(height: 8),
            Text(error.toString(), style: Theme.of(context).textTheme.bodySmall, textAlign: TextAlign.center),
            const SizedBox(height: 24),
            WibeButton(text: 'Retry', onPressed: () => context.pop(), width: 120),
          ],
        ),
      );
    }

  Widget _buildGroupInfo(BuildContext context, WidgetRef ref, Group group, CurrentUser? currentUser) {
    final theme = Theme.of(context);
    final isAdmin = group.isAdmin;
    final isOwner = group.isOwner;

    return SingleChildScrollView(
      child: Column(
        children: [
          // Group header
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: theme.colorScheme.surface,
              border: Border(bottom: BorderSide(color: theme.dividerColor)),
            ),
            child: Column(
              children: [
                Stack(
                  children: [
                    WibeAvatar(
                      imageUrl: group.avatarUrl,
                      name: group.name,
                      radius: 50,
                    ),
                    if (isAdmin)
                      Positioned(
                        bottom: 0,
                        right: 0,
                        child: Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: theme.colorScheme.primary,
                            shape: BoxShape.circle,
                          ),
                          child: Icon(Icons.camera_alt, size: 20, color: theme.colorScheme.onPrimary),
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 16),
                Text(
                  group.name,
                  style: theme.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
                ),
                if (group.description != null && group.description!.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  Text(
                    group.description!,
                    style: theme.textTheme.bodyMedium?.copyWith(
                          color: theme.colorScheme.onSurfaceVariant,
                        ),
                    textAlign: TextAlign.center,
                  ),
                ],
                const SizedBox(height: 12),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    _buildInfoChip(context, Icons.people, '${group.memberCount} members'),
                    const SizedBox(width: 12),
                    _buildInfoChip(context, Icons.admin_panel_settings, _getRoleText(group.role)),
                  ],
                ),
              ],
            ),
          ),

          // Member count and actions
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    icon: const Icon(Icons.people),
                    label: const Text('View Members'),
                    onPressed: () => context.push('/groups/$groupId/members'),
                  ),
                ),
                if (isAdmin) ...[
                  const SizedBox(width: 12),
                  Expanded(
                    child: OutlinedButton.icon(
                      icon: const Icon(Icons.settings),
                      label: const Text('Settings'),
                      onPressed: () => context.push('/groups/$groupId/settings'),
                    ),
                  ),
                ],
              ],
            ),
          ),

          // Group media
          if (group.members.isNotEmpty) ...[
            const Divider(),
            _buildSectionHeader(context, 'Recent Members'),
            SizedBox(
              height: 80,
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 16),
                itemCount: group.members.length > 10 ? 10 : group.members.length,
                itemBuilder: (context, index) {
                  final member = group.members[index];
                  return _buildMemberAvatar(context, member);
                },
              ),
            ),
          ],

          // Group actions for admins
          if (isAdmin) ...[
            const Divider(),
            _buildSectionHeader(context, 'Admin Actions'),
            ListTile(
              leading: const Icon(Icons.group_add),
              title: const Text('Add Members'),
              trailing: const Icon(Icons.chevron_right),
              onTap: () => _showAddMembersSheet(context, ref),
            ),
            if (isOwner) ...[
              ListTile(
                leading: const Icon(Icons.admin_panel_settings),
                title: const Text('Manage Admins'),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => context.push('/groups/$groupId/members?manage=true'),
              ),
            ],
          ],

          // Leave group
          const Divider(),
          ListTile(
            leading: Icon(Icons.exit_to_app, color: WibeColors.error),
            title: Text('Leave Group', style: TextStyle(color: WibeColors.error)),
            onTap: () => _showLeaveConfirmation(context, ref),
          ),

          // Delete group (owner only)
          if (isOwner) ...[
            ListTile(
              leading: Icon(Icons.delete_forever, color: WibeColors.error),
              title: Text('Delete Group', style: TextStyle(color: WibeColors.error)),
              onTap: () => _showDeleteConfirmation(context, ref),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildInfoChip(BuildContext context, IconData icon, String label) {
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: theme.colorScheme.surfaceVariant,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: theme.colorScheme.onSurfaceVariant),
          const SizedBox(width: 6),
          Text(label, style: theme.textTheme.labelMedium?.copyWith(color: theme.colorScheme.onSurfaceVariant)),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(BuildContext context, String title) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
      child: Align(
        alignment: Alignment.centerLeft,
        child: Text(
          title.toUpperCase(),
          style: theme.textTheme.labelSmall?.copyWith(
            color: theme.colorScheme.onSurfaceVariant,
            letterSpacing: 1,
          ),
        ),
      ),
    );
  }

  Widget _buildMemberAvatar(BuildContext context, GroupMember member) {
    return Container(
      width: 60,
      margin: const EdgeInsets.only(right: 12),
      child: Column(
        children: [
          WibeAvatar(
            imageUrl: member.avatarUrl,
            name: member.displayName,
            radius: 24,
          ),
          const SizedBox(height: 4),
          Text(
            member.displayName,
            style: Theme.of(context).textTheme.labelSmall,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            textAlign: TextAlign.center,
          ),
          if (member.role != GroupRole.member)
            Container(
              margin: const EdgeInsets.only(top: 2),
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
              decoration: BoxDecoration(
                color: WibeColors.primary.withOpacity(0.2),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                _getRoleText(member.role),
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                      color: WibeColors.primary,
                      fontSize: 10,
                      fontWeight: FontWeight.w600,
                    ),
              ),
            ),
        ],
      ),
    );
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

  void _showMoreOptions(BuildContext context, WidgetRef ref) {
    showModalBottomSheet(
      context: context,
      builder: (context) => _GroupInfoMoreOptions(groupId: groupId),
    );
  }

  void _showAddMembersSheet(BuildContext context, WidgetRef ref) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (context) => _AddMembersSheet(groupId: groupId),
    );
  }

  void _showLeaveConfirmation(BuildContext context, WidgetRef ref) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Leave Group?'),
        content: const Text('You will no longer receive messages from this group. You can rejoin later if invited.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
          TextButton(
            onPressed: () async {
              Navigator.pop(context);
              await ref.read(leaveGroupUseCaseProvider).execute(groupId);
              if (context.mounted) context.pop(true);
            },
            style: TextButton.styleFrom(foregroundColor: WibeColors.error),
            child: const Text('Leave Group'),
          ),
        ],
      ),
    );
  }

  void _showDeleteConfirmation(BuildContext context, WidgetRef ref) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Group?'),
        content: const Text('This action cannot be undone. All group messages and media will be deleted for everyone.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
          TextButton(
            onPressed: () async {
              Navigator.pop(context);
              await ref.read(deleteGroupUseCaseProvider).execute(groupId);
              if (context.mounted) context.pop(true);
            },
            style: TextButton.styleFrom(foregroundColor: WibeColors.error),
            child: const Text('Delete Group'),
          ),
        ],
      ),
    );
  }
}

class _GroupInfoMoreOptions extends ConsumerWidget {
  final String groupId;

  const _GroupInfoMoreOptions({required this.groupId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return SafeArea(
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
            leading: const Icon(Icons.notifications_off),
            title: const Text('Mute Notifications'),
            onTap: () {
              Navigator.pop(context);
              // TODO: Implement mute
            },
          ),
          ListTile(
            leading: const Icon(Icons.search),
            title: const Text('Search in Group'),
            onTap: () {
              Navigator.pop(context);
              // TODO: Implement search
            },
          ),
          ListTile(
            leading: const Icon(Icons.star_border),
            title: const Text('Starred Messages'),
            onTap: () {
              Navigator.pop(context);
              // TODO: Implement starred messages
            },
          ),
          ListTile(
            leading: const Icon(Icons.help_outline),
            title: const Text('Group Help'),
            onTap: () {
              Navigator.pop(context);
              // TODO: Implement help
            },
          ),
        ],
      ),
    );
  }
}

class _AddMembersSheet extends ConsumerWidget {
  final String groupId;

  const _AddMembersSheet({required this.groupId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return DraggableScrollableSheet(
      initialChildSize: 0.6,
      maxChildSize: 0.9,
      minChildSize: 0.4,
      builder: (context, scrollController) => Container(
        padding: const EdgeInsets.all(16),
        child: Column(
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
            Text('Add Members', style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold)),
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
                controller: scrollController,
                children: [
                  ListTile(
                    leading: WibeAvatar(name: 'New Contact', backgroundColor: WibeColors.primary),
                    title: const Text('New Contact'),
                    onTap: () {
                      // Add contact
                    },
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}