import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../../core/constants/colors.dart';
import '../../../../../core/theme/app_theme.dart';
import '../../../../../presentation/shared/widgets/wibe_avatar.dart';
import '../../../../domain/entities/status.dart'
import '../providers/status_providers.dart'
import 'status_viewer_screen.dart'

class StatusListScreen extends ConsumerStatefulWidget {
  const StatusListScreen({super.key});

  @override
  ConsumerState<StatusListScreen> createState() => _StatusListScreenState();
}

class _StatusListScreenState extends ConsumerState<StatusListScreen> {
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final statusesAsync = ref.watch(statusesProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Status'),
        actions: [
          IconButton(
            icon: const Icon(Icons.settings),
            onPressed: () {
              // Navigate to status privacy settings
            },
          ),
        ],
      ),
      body: statusesAsync.when(
        loading: () => _buildLoadingState(context),
        error: (error, stack) => _buildErrorState(context, error),
        data: (statuses) {
          if (statuses.isEmpty) {
            return _buildEmptyState(context);
          }

          // Group by user
          final Map<String, List<Status>> userStatuses = {};
          for (final status in statuses) {
            if (!status.isExpired) {
              userStatuses.putIfAbsent(status.userId, () => []).add(status);
            }
          }

          return ListView(
            children: [
              // Own status
              _buildOwnStatusCard(context),
              const Divider(),
              // Contacts' statuses
              if (userStatuses.isNotEmpty) ...[
                _buildSectionHeader(context, 'Recent Updates'),
                ...userStatuses.entries.map((entry) {
                  return _buildUserStatusCard(context, entry.value);
                }),
              ],
            ],
          );
        },
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => context.push('/status/create'),
        child: const Icon(Icons.add),
      ),
    );
  }

  Widget _buildLoadingState(BuildContext context) {
    return ListView.builder(
      itemCount: 5,
      itemBuilder: (_, __) => _buildShimmerCard(context),
    );
  }

  Widget _buildShimmerCard(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          CircleAvatar(
            radius: 28,
            backgroundColor: Theme.of(context).colorScheme.surfaceVariant,
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(height: 16, width: 100, color: Theme.of(context).colorScheme.surfaceVariant),
                const SizedBox(height: 8),
                Container(height: 12, width: 150, color: Theme.of(context).colorScheme.surfaceVariant),
              ],
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
          Text('Failed to load statuses', style: Theme.of(context).textTheme.headlineSmall),
          const SizedBox(height: 8),
          Text(error.toString(), style: Theme.of(context).textTheme.bodySmall, textAlign: TextAlign.center),
          const SizedBox(height: 24),
          WibeButton(text: 'Retry', onPressed: () => ref.invalidate(statusesProvider), width: 120),
        ],
      ),
    );
  }

  Widget _buildEmptyState(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.circle_outlined, size: 64, color: Theme.of(context).colorScheme.onSurfaceVariant),
          const SizedBox(height: 16),
          Text(
            'No statuses yet',
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                ),
          ),
          const SizedBox(height: 8),
          Text(
            'When contacts post statuses, they\'ll appear here',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                ),
            textAlign: TextAlign.center,
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

  Widget _buildOwnStatusCard(BuildContext context) {
    final theme = Theme.of(context);

    return ListTile(
      leading: Stack(
        children: [
          WibeAvatar(name: 'You', radius: 28),
          Positioned(
            bottom: 0,
            right: 0,
            child: Container(
              padding: const EdgeInsets.all(4),
              decoration: BoxDecoration(
                color: theme.colorScheme.primary,
                shape: BoxShape.circle,
                border: Border.all(color: theme.colorScheme.surface, width: 2),
              ),
              child: Icon(Icons.add, size: 18, color: theme.colorScheme.onPrimary),
            ),
          ],
        ),
      title: const Text('My Status'),
      subtitle: Text(
        'Tap to add status update',
        style: theme.textTheme.bodySmall?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
      onTap: () => context.push('/status/create'),
    );
  }

  Widget _buildUserStatusCard(BuildContext context, List<Status> userStatuses) {
    if (userStatuses.isEmpty) return const SizedBox.shrink();

    final firstStatus = userStatuses.first;
    final unviewedCount = userStatuses.where((s) => !s.views.any((v) => v.viewerId == ref.read(currentUserProvider)?.id)).length;

    return ListTile(
      leading: Stack(
        children: [
          WibeAvatar(
            imageUrl: firstStatus.userAvatarUrl,
            name: firstStatus.userDisplayName,
            radius: 28,
          ),
          if (unviewedCount > 0)
            Positioned(
              bottom: 0,
              right: 0,
              child: Container(
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(
                  color: WibeColors.primary,
                  shape: BoxShape.circle,
                  border: Border.all(color: Theme.of(context).colorScheme.surface, width: 2),
                ),
                child: Text(
                  unviewedCount.toString(),
                  style: TextStyle(color: Theme.of(context).colorScheme.onPrimary, fontSize: 10, fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),
        ),
      title: Text(firstStatus.userDisplayName ?? 'Unknown'),
      subtitle: Text(
        '${userStatuses.length} update${userStatuses.length > 1 ? 's' : ''}',
        style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: Theme.of(context).colorScheme.onSurfaceVariant,
            ),
      ),
      trailing: Text(
        firstStatus.timeRemaining,
        style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: Theme.of(context).colorScheme.onSurfaceVariant,
            ),
      ),
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => StatusViewerScreen(
              statuses: userStatuses,
              initialIndex: 0,
            ),
          ),
        );
      },
    );
  }
}