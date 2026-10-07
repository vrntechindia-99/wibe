import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../../core/constants/colors.dart';
import '../../../../../core/theme/app_theme.dart';
import '../../../../../presentation/shared/widgets/wibe_avatar.dart';
import '../../../../../presentation/shared/widgets/wibe_button.dart';
import '../../../../../presentation/shared/widgets/wibe_text_field.dart';
import '../../../../../domain/entities/group.dart';
import '../../../../../domain/entities/conversation.dart';
import '../../../conversations/presentation/providers/conversation_providers.dart';
import '../providers/group_providers.dart';

class GroupCreateScreen extends ConsumerStatefulWidget {
  const GroupCreateScreen({super.key});

  @override
  ConsumerState<GroupCreateScreen> createState() => _GroupCreateScreenState();
}

class _GroupCreateScreenState extends ConsumerState<GroupCreateScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _searchController = TextEditingController();

  String _searchQuery = '';
  List<String> _selectedMemberIds = [];
  bool _isCreating = false;

  @override
  void dispose() {
    _nameController.dispose();
    _descriptionController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final conversationsAsync = ref.watch(conversationsProvider);
    final creating = ref.watch(creatingGroupProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('New Group'),
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: creating ? null : () => context.pop(),
        ),
      ),
      body: Form(
        key: _formKey,
        child: Column(
          children: [
            // Group avatar
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  Stack(
                    children: [
                      WibeAvatar(
                        name: _nameController.text.isNotEmpty ? _nameController.text : 'Group',
                        radius: 50,
                        backgroundColor: WibeColors.primary,
                      ),
                      Positioned(
                        bottom: 0,
                        right: 0,
                        child: Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: WibeColors.primary,
                            shape: BoxShape.circle,
                            border: Border.all(color: theme.colorScheme.surface, width: 2),
                          ),
                          child: Icon(
                            Icons.camera_alt,
                            size: 20,
                            color: theme.colorScheme.onPrimary,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Group name required',
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                  ),
                ],
              ),
            ),

            // Group name
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: WibeTextField(
                label: 'Group Name',
                hint: 'Enter group name',
                controller: _nameController,
                textInputAction: TextInputAction.next,
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return 'Group name is required';
                  }
                  if (value.trim().length > 100) {
                    return 'Group name must be less than 100 characters';
                  }
                  return null;
                },
                onChanged: (value) => setState(() {}),
              ),
            ),

            // Description
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: WibeTextField(
                label: 'Description (optional)',
                hint: 'What is this group about?',
                controller: _descriptionController,
                maxLines: 2,
                maxLength: 500,
              ),
            ),

            // Members section
            const Divider(),
            Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Members (${_selectedMemberIds.length})',
                    style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600),
                  ),
                  if (_selectedMemberIds.isNotEmpty)
                    TextButton.icon(
                      icon: const Icon(Icons.clear_all, size: 18),
                      label: const Text('Clear'),
                      onPressed: () => setState(() => _selectedMemberIds.clear()),
                    ),
                ],
              ),
            ),

            // Selected members chips
            if (_selectedMemberIds.isNotEmpty)
              SizedBox(
                height: 80,
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  itemCount: _selectedMemberIds.length,
                  itemBuilder: (context, index) {
                    final memberId = _selectedMemberIds[index];
                    // We need to get the member info from conversations
                    final conversation = conversationsAsync.valueOrNull?.firstWhere(
                      (c) => c.members.any((m) => m.userId == memberId),
                      orElse: () => null,
                    );
                    final member = conversation?.members.firstWhere(
                      (m) => m.userId == memberId,
                      orElse: () => null,
                    );

                    return Container(
                      width: 70,
                      margin: const EdgeInsets.only(right: 8),
                      child: Column(
                        children: [
                          Stack(
                            children: [
                              WibeAvatar(
                                name: member?.displayName ?? 'User',
                                avatarUrl: member?.avatarUrl,
                                radius: 28,
                              ),
                              Positioned(
                                bottom: 0,
                                right: 0,
                                child: GestureDetector(
                                  onTap: () => setState(() => _selectedMemberIds.removeAt(index)),
                                  child: Container(
                                    padding: const EdgeInsets.all(4),
                                    decoration: BoxDecoration(
                                      color: WibeColors.error,
                                      shape: BoxShape.circle,
                                    ),
                                    child: Icon(Icons.close, size: 14, color: theme.colorScheme.onError),
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 4),
                          Text(
                            member?.displayName ?? 'User',
                            style: theme.textTheme.labelSmall,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      );
                  },
                ),
              ),

            // Search and add members
            Padding(
              padding: const EdgeInsets.all(16),
              child: WibeTextField(
                label: 'Add Members',
                hint: 'Search contacts...',
                controller: _searchController,
                prefixIcon: const Icon(Icons.search),
                onChanged: (value) {
                  setState(() => _searchQuery = value);
                },
              ),
            ),

            // Search results
            Expanded(
              child: _buildContactList(),
            ),

            // Create button
            Padding(
              padding: const EdgeInsets.all(16),
              child: WibeButton(
                text: 'Create Group',
                onPressed: _isCreating || _selectedMemberIds.isEmpty ? null : _createGroup,
                isLoading: _isCreating,
                width: double.infinity,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildContactList() {
    final conversationsAsync = ref.watch(conversationsProvider);
    final searchQuery = ref.watch(groupSearchQueryProvider);

    return conversationsAsync.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (error, stack) => Center(child: Text('Error: $error')),
      data: (conversations) {
        final directContacts = conversations
            .where((c) => c.type == ConversationType.direct)
            .expand((c) => c.members.where((m) => !_selectedMemberIds.contains(m.userId)))
            .where((m) => m.displayName.toLowerCase().contains(_searchQuery.toLowerCase()))
            .toList();

        if (directContacts.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.group_outlined, size: 64, color: Theme.of(context).colorScheme.onSurfaceVariant),
                const SizedBox(height: 16),
                Text(
                  _searchQuery.isNotEmpty ? 'No contacts found' : 'Select contacts to add',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        color: Theme.of(context).colorScheme.onSurfaceVariant,
                      ),
                ),
              ],
            ),
          );
        }

        return ListView.builder(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          itemCount: directContacts.length,
          itemBuilder: (context, index) {
            final member = directContacts[index];
            final isSelected = _selectedMemberIds.contains(member.userId);

            return ListTile(
              leading: WibeAvatar(
                name: member.displayName,
                avatarUrl: member.avatarUrl,
                radius: 24,
              ),
              title: Text(member.displayName),
              subtitle: Text(member.userId),
              trailing: isSelected
                  ? Icon(Icons.check_circle, color: WibeColors.primary)
                  : Icon(Icons.add_circle_outline, color: Theme.of(context).colorScheme.onSurfaceVariant),
              onTap: () {
                setState(() {
                  if (isSelected) {
                    _selectedMemberIds.remove(member.userId);
                  } else {
                    _selectedMemberIds.add(member.userId);
                  }
                });
              },
            );
          },
        );
      },
    );
  }

  Future<void> _createGroup() async {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedMemberIds.isEmpty) return;

    setState(() => _isCreating = true);
    ref.read(creatingGroupProvider.notifier).state = true;

    try {
      await ref.read(createGroupUseCaseProvider).execute(
        name: _nameController.text.trim(),
        description: _descriptionController.text.trim().isEmpty ? null : _descriptionController.text.trim(),
        memberIds: _selectedMemberIds,
      );

      if (mounted) {
        context.pop(true); // Return true to indicate group was created
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to create group: $e'), backgroundColor: WibeColors.error),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isCreating = false);
        ref.read(creatingGroupProvider.notifier).state = false;
      }
    }
  }
}