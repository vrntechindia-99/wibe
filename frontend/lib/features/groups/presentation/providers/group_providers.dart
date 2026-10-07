import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/repositories/group_repository_impl.dart';
import '../../domain/repositories/group_repository.dart';
import '../../domain/usecases/create_group_usecase.dart';
import '../../domain/usecases/get_groups_usecase.dart';
import '../../domain/usecases/get_group_usecase.dart';
import '../../domain/usecases/update_group_usecase.dart';
import '../../domain/usecases/update_group_settings_usecase.dart';
import '../../domain/usecases/add_members_usecase.dart';
import '../../domain/usecases/remove_member_usecase.dart';
import '../../domain/usecases/leave_group_usecase.dart';
import '../../domain/usecases/promote_admin_usecase.dart';
import '../../domain/usecases/demote_admin_usecase.dart';
import '../../domain/usecases/search_groups_usecase.dart';
import '../../domain/usecases/get_group_usecase.dart';
import '../../domain/usecases/get_group_members_usecase.dart';
import '../../domain/usecases/leave_group_usecase.dart';
import '../../domain/usecases/delete_group_usecase.dart';
import '../../../../core/di/injection.dart';

final groupRepositoryProvider = Provider<GroupRepository>((ref) {
  return getIt<GroupRepository>();
});

final getGroupsUseCaseProvider = Provider<GetGroupsUseCase>((ref) {
  return GetGroupsUseCase(ref.read(groupRepositoryProvider));
});

final createGroupUseCaseProvider = Provider<CreateGroupUseCase>((ref) {
  return CreateGroupUseCase(ref.read(groupRepositoryProvider));
});

final getGroupUseCaseProvider = Provider<GetGroupUseCase>((ref) {
  return GetGroupUseCase(ref.read(groupRepositoryProvider));
});

final updateGroupUseCaseProvider = Provider<UpdateGroupUseCase>((ref) {
  return UpdateGroupUseCase(ref.read(groupRepositoryProvider));
});

final updateGroupSettingsUseCaseProvider = Provider<UpdateGroupSettingsUseCase>((ref) {
  return UpdateGroupSettingsUseCase(ref.read(groupRepositoryProvider));
});

final addMembersUseCaseProvider = Provider<AddMembersUseCase>((ref) {
  return AddMembersUseCase(ref.read(groupRepositoryProvider));
});

final removeMemberUseCaseProvider = Provider<RemoveMemberUseCase>((ref) {
  return RemoveMemberUseCase(ref.read(groupRepositoryProvider));
});

final leaveGroupUseCaseProvider = Provider<LeaveGroupUseCase>((ref) {
  return LeaveGroupUseCase(ref.read(groupRepositoryProvider));
});

final promoteAdminUseCaseProvider = Provider<PromoteAdminUseCase>((ref) {
  return PromoteAdminUseCase(ref.read(groupRepositoryProvider));
});

final demoteAdminUseCaseProvider = Provider<DemoteAdminUseCase>((ref) {
  return DemoteAdminUseCase(ref.read(groupRepositoryProvider));
});

final searchGroupsUseCaseProvider = Provider<SearchGroupsUseCase>((ref) {
  return SearchGroupsUseCase(ref.read(groupRepositoryProvider));
});

final getGroupUseCaseProvider = Provider<GetGroupUseCase>((ref) {
  return GetGroupUseCase(ref.read(groupRepositoryProvider));
});

final getGroupMembersUseCaseProvider = Provider<GetGroupMembersUseCase>((ref) {
  return GetGroupMembersUseCase(ref.read(groupRepositoryProvider));
});

final leaveGroupUseCaseProvider = Provider<LeaveGroupUseCase>((ref) {
  return LeaveGroupUseCase(ref.read(groupRepositoryProvider));
});

final deleteGroupUseCaseProvider = Provider<DeleteGroupUseCase>((ref) {
  return DeleteGroupUseCase(ref.read(groupRepositoryProvider));
});

// State providers
final groupsProvider = StateNotifierProvider<GroupsNotifier, AsyncValue<List<Group>>>((ref) {
  return GroupsNotifier(ref.read(getGroupsUseCaseProvider));
});

class GroupsNotifier extends StateNotifier<AsyncValue<List<Group>>> {
  final GetGroupsUseCase _getGroupsUseCase;

  GroupsNotifier(this._getGroupsUseCase) : super(const AsyncValue.loading()) {
    load();
  }

  Future<void> load({String? search}) async {
    state = const AsyncValue.loading();
    try {
      final groups = await _getGroupsUseCase.execute(search: search);
      state = AsyncValue.data(groups);
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
    }
  }

  void addGroup(Group group) {
    state = state.whenData((list) => [group, ...list]);
  }

  void updateGroup(Group group) {
    state = state.whenData((list) => list.map((g) => g.id == group.id ? group : g).toList());
  }

  void removeGroup(String groupId) {
    state = state.whenData((list) => list.where((g) => g.id != groupId).toList());
  }
}

final groupSearchQueryProvider = StateProvider<String>((ref) => '');

final filteredGroupsProvider = Provider<AsyncValue<List<Group>>>((ref) {
  final groups = ref.watch(groupsProvider);
  final query = ref.watch(groupSearchQueryProvider);

  return groups.whenData((list) {
    if (query.isEmpty) return list;
    final lowerQuery = query.toLowerCase();
    return list.where((g) =>
      g.name.toLowerCase().contains(lowerQuery) ||
      (g.description?.toLowerCase().contains(lowerQuery) ?? false)
    ).toList();
  });
});

final groupDetailProvider = StateNotifierProvider.family<GroupDetailNotifier, AsyncValue<Group?>, String>((ref, groupId) {
  return GroupDetailNotifier(ref.read(getGroupUseCaseProvider), groupId);
});

class GroupDetailNotifier extends StateNotifier<AsyncValue<Group?>> {
  final GetGroupUseCase _getGroupUseCase;
  final String _groupId;

  GroupDetailNotifier(this._getGroupUseCase, this._groupId) : super(const AsyncValue.loading()) {
    load();
  }

  Future<void> load() async {
    state = const AsyncValue.loading();
    try {
      final group = await _getGroupUseCase.execute(_groupId);
      state = AsyncValue.data(group);
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
    }
  }

  void updateGroup(Group group) {
    state = AsyncValue.data(group);
  }
}

final groupMembersProvider = StateNotifierProvider.family<GroupMembersNotifier, AsyncValue<List<GroupMember>>, String>((ref, groupId) {
  return GroupMembersNotifier(ref.read(getGroupMembersUseCaseProvider), groupId);
});

class GroupMembersNotifier extends StateNotifier<AsyncValue<List<GroupMember>>> {
  final GetGroupMembersUseCase _getMembersUseCase;
  final String _groupId;

  GroupMembersNotifier(this._getMembersUseCase, this._groupId) : super(const AsyncValue.loading()) {
    load();
  }

  Future<void> load({int page = 1, int limit = 50}) async {
    state = const AsyncValue.loading();
    try {
      final members = await _getMembersUseCase.execute(_groupId, page: page, limit: limit);
      state = AsyncValue.data(members);
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
    }
  }

  void addMember(GroupMember member) {
    state = state.whenData((list) => [member, ...list]);
  }

  void removeMember(String userId) {
    state = state.whenData((list) => list.where((m) => m.userId != userId).toList());
  }

  void updateMemberRole(String userId, GroupRole role) {
    state = state.whenData((list) => list.map((m) =>
      m.userId == userId ? m.copyWith(role: role) : m
    ).toList());
  }
}

final groupSearchQueryProvider = StateProvider<String>((ref) => '');

final searchedGroupsProvider = Provider<AsyncValue<List<Group>>>((ref) {
  final query = ref.watch(groupSearchQueryProvider);
  if (query.length < 2) return const AsyncValue.data([]);

  return ref.watch(searchGroupsUseCaseProvider).execute(query);
});

final creatingGroupProvider = StateProvider<bool>((ref) => false);