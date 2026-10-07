import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../../core/constants/colors.dart';
import '../../../../../core/theme/app_theme.dart';
import '../../../../../presentation/shared/widgets/wibe_text_field.dart';
import '../../../../../domain/entities/group.dart'
import '../providers/group_providers.dart'

class GroupSettingsScreen extends ConsumerStatefulWidget {
  final String groupId;

  const GroupSettingsScreen({super.key, required this.groupId});

  @override
  ConsumerState<GroupSettingsScreen> createState() => _GroupSettingsScreenState();
}

class _GroupSettingsScreenState extends ConsumerState<GroupSettingsScreen> {
  final _nameController = TextEditingController();
  final _descriptionController = TextEditingController();

  bool _onlyAdminsCanSend = false;
  bool _onlyAdminsCanEditInfo = false;
  bool _onlyAdminsCanAddMembers = false;
  int _maxMembers = 500;
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    _loadSettings();
  }

  Future<void> _loadSettings() async {
    final group = ref.read(groupDetailProvider(widget.groupId)).value;
    if (group != null) {
      _nameController.text = group.name;
      _descriptionController.text = group.description ?? '';
      _onlyAdminsCanSend = group.settings['onlyAdminsCanSend'] as bool? ?? false;
      _onlyAdminsCanEditInfo = group.settings['onlyAdminsCanEditInfo'] as bool? ?? false;
      _onlyAdminsCanAddMembers = group.settings['onlyAdminsCanAddMembers'] as bool? ?? false;
      _maxMembers = group.settings['maxMembers'] as int? ?? 500;
      setState(() {});
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final groupAsync = ref.watch(groupDetailProvider(widget.groupId));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Group Settings'),
        actions: [
          TextButton(
            onPressed: _isSaving ? null : _saveSettings,
            child: _isSaving
                ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
                : const Text('Save'),
          ),
        ],
      ),
      body: groupAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) => _buildErrorState(context, error),
        data: (group) {
          if (group == null) return _buildErrorState(context, 'Group not found');

          final isOwner = group.isOwner;
          final isAdmin = group.isAdmin;

          if (!isOwner && !isAdmin) {
            return _buildPermissionDenied(context);
          }

          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              // Group name
              WibeTextField(
                label: 'Group Name',
                controller: _nameController,
                hint: 'Enter group name',
                validator: (value) {
                  if (value == null || value.trim().isEmpty) return 'Group name is required';
                  if (value.trim().length > 100) return 'Name must be less than 100 characters';
                  return null;
                },
              ),
              const SizedBox(height: 16),

              // Description
              WibeTextField(
                label: 'Description',
                controller: _descriptionController,
                hint: 'Group description',
                maxLines: 3,
                maxLength: 500,
              ),
              const SizedBox(height: 16),

              // Group avatar
              ListTile(
                leading: const Icon(Icons.image),
                title: const Text('Group Photo'),
                subtitle: Text(group.avatarUrl != null ? 'Current photo set' : 'No photo set'),
                trailing: const Icon(Icons.chevron_right),
                onTap: isAdmin ? _changeAvatar : null,
              ),

              const Divider(),

              // Admin-only settings
              if (isOwner) ...[
                _buildSectionHeader(context, 'Admin Settings'),

                SwitchListTile(
                  title: const Text('Only admins can send messages'),
                  subtitle: const Text('Members cannot send messages'),
                  value: _onlyAdminsCanSend,
                  onChanged: (value) => setState(() => _onlyAdminsCanSend = value),
                ),

                SwitchListTile(
                  title: const Text('Only admins can edit group info'),
                  subtitle: const Text('Members cannot change name, description, or photo'),
                  value: _onlyAdminsCanEditInfo,
                  onChanged: (value) => setState(() => _onlyAdminsCanEditInfo = value),
                ),

                SwitchListTile(
                  title: const Text('Only admins can add members'),
                  subtitle: const Text('Members cannot add new members'),
                  value: _onlyAdminsCanAddMembers,
                  onChanged: (value) => setState(() => _onlyAdminsCanAddMembers = value),
                ),

                ListTile(
                  title: const Text('Maximum members'),
                  subtitle: Text('$_maxMembers members'),
                  trailing: DropdownButton<int>(
                    value: _maxMembers,
                    items: [100, 250, 500, 1000, 2000, 5000].map((v) => DropdownMenuItem(value: v, child: Text('$v'))).toList(),
                    onChanged: (v) => v != null ? setState(() => _maxMembers = v) : null,
                  ),
                ),

                const Divider(),
              ],

              // Notifications
              _buildSectionHeader(context, 'Notifications'),

              ListTile(
                leading: const Icon(Icons.notifications),
                title: const Text('Message Notifications'),
                subtitle: const Text('Receive notifications for new messages'),
                trailing: Switch(
                  value: true, // TODO: Get from preferences
                  onChanged: (v) {},
                ),
              ),

              ListTile(
                leading: const Icon(Icons.volume_up),
                title: const Text('Sound'),
                subtitle: const Text('Play sound for new messages'),
                trailing: Switch(
                  value: true,
                  onChanged: (v) {},
                ),
              ),

              const Divider(),

              // Group info
              _buildSectionHeader(context, 'Group Info'),

              ListTile(
                leading: const Icon(Icons.calendar_today),
                title: const Text('Created'),
                subtitle: Text('${group.createdAt.day}/${group.createdAt.month}/${group.createdAt.year}'),
              ),

              if (isOwner) ...[
                const Divider(),
                _buildSectionHeader(context, 'Danger Zone'),

                ListTile(
                  leading: Icon(Icons.delete_forever, color: WibeColors.error),
                  title: Text('Delete Group', style: TextStyle(color: WibeColors.error)),
                  subtitle: const Text('This action cannot be undone'),
                  onTap: _showDeleteConfirmation,
                ),
              ],
            ],
          ),
        ),
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
          Text('Failed to load settings', style: Theme.of(context).textTheme.headlineSmall),
          const SizedBox(height: 8),
          Text(error.toString(), style: Theme.of(context).textTheme.bodySmall, textAlign: TextAlign.center),
        ],
      ),
    );
  }

  Widget _buildPermissionDenied(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.lock_outline, size: 64, color: Theme.of(context).colorScheme.onSurfaceVariant),
            const SizedBox(height: 16),
            Text('Permission Denied', style: Theme.of(context).textTheme.headlineSmall),
            const SizedBox(height: 8),
            Text('Only admins can access group settings', style: Theme.of(context).textTheme.bodyMedium),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionHeader(BuildContext context, String title) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(0, 16, 0, 8),
      child: Text(
        title.toUpperCase(),
        style: Theme.of(context).textTheme.labelSmall?.copyWith(
              color: Theme.of(context).colorScheme.onSurfaceVariant,
              letterSpacing: 1,
            ),
      ),
    );
  }

  Future<void> _saveSettings() async {
    setState(() => _isSaving = true);

    try {
      await ref.read(updateGroupUseCaseProvider).execute(
        widget.groupId,
        name: _nameController.text.trim(),
        description: _descriptionController.text.trim().isEmpty ? null : _descriptionController.text.trim(),
      );

      await ref.read(updateGroupSettingsUseCaseProvider).execute(widget.groupId, {
        'onlyAdminsCanSend': _onlyAdminsCanSend,
        'onlyAdminsCanEditInfo': _onlyAdminsCanEditInfo,
        'onlyAdminsCanAddMembers': _onlyAdminsCanAddMembers,
        'maxMembers': _maxMembers,
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Settings saved')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to save: $e'), backgroundColor: WibeColors.error),
        );
      }
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  void _changeAvatar() {
    // TODO: Implement avatar change
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Avatar change coming soon')),
    );
  }

  void _showDeleteConfirmation() {
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
              await ref.read(deleteGroupUseCaseProvider).execute(widget.groupId);
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