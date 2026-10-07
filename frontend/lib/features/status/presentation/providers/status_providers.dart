import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/datasources/remote_status_datasource.dart';
import '../../data/datasources/local_status_datasource.dart';
import '../../data/repositories/status_repository_impl.dart';
import '../../domain/repositories/status_repository.dart';
import '../../domain/usecases/create_status_usecase.dart';
import '../../domain/usecases/get_statuses_usecase.dart';
import '../../domain/usecases/view_status_usecase.dart';
import '../../domain/usecases/reply_to_status_usecase.dart';
import '../../domain/usecases/add_status_reaction_usecase.dart';
import '../../domain/usecases/delete_status_usecase.dart';
import '../../../../core/di/injection.dart';

final statusRepositoryProvider = Provider<StatusRepository>((ref) {
  return getIt<StatusRepository>();
});

final createStatusUseCaseProvider = Provider<CreateStatusUseCase>((ref) {
  return CreateStatusUseCase(ref.read(statusRepositoryProvider));
});

final getStatusesUseCaseProvider = Provider<GetStatusesUseCase>((ref) {
  return GetStatusesUseCase(ref.read(statusRepositoryProvider));
});

final viewStatusUseCaseProvider = Provider<ViewStatusUseCase>((ref) {
  return ViewStatusUseCase(ref.read(statusRepositoryProvider));
});

final replyToStatusUseCaseProvider = Provider<ReplyToStatusUseCase>((ref) {
  return ReplyToStatusUseCase(ref.read(statusRepositoryProvider));
});

final addStatusReactionUseCaseProvider = Provider<AddStatusReactionUseCase>((ref) {
  return AddStatusReactionUseCase(ref.read(statusRepositoryProvider));
});

final deleteStatusUseCaseProvider = Provider<DeleteStatusUseCase>((ref) {
  return DeleteStatusUseCase(ref.read(statusRepositoryProvider));
});

// Status service for direct API calls
final statusServiceProvider = Provider<StatusService>((ref) {
  return getIt<StatusService>();
});

// State providers
final statusesProvider = StateNotifierProvider<StatusesNotifier, AsyncValue<List<Status>>>((ref) {
  return StatusesNotifier(ref.read(getStatusesUseCaseProvider));
});

class StatusesNotifier extends StateNotifier<AsyncValue<List<Status>>> {
  final GetStatusesUseCase _getStatusesUseCase;

  StatusesNotifier(this._getStatusesUseCase) : super(const AsyncValue.loading()) {
    load();
  }

  Future<void> load() async {
    state = const AsyncValue.loading();
    try {
      final statuses = await _getStatusesUseCase.execute();
      state = AsyncValue.data(statuses);
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
    }
  }

  void addStatus(Status status) {
    state = state.whenData((list) => [status, ...list]);
  }

  void updateStatus(Status status) {
    state = state.whenData((list) => list.map((s) => s.id == status.id ? status : s).toList());
  }

  void removeStatus(String statusId) {
    state = state.whenData((list) => list.where((s) => s.id != statusId).toList());
  }
}

final statusDetailProvider = StateNotifierProvider.family<StatusDetailNotifier, AsyncValue<Status?>, String>((ref, statusId) {
  return StatusDetailNotifier(ref.read(getStatusesUseCaseProvider), statusId);
});

class StatusDetailNotifier extends StateNotifier<AsyncValue<Status?>> {
  final GetStatusesUseCase _getStatusesUseCase;
  final String _statusId;

  StatusDetailNotifier(this._getStatusesUseCase, this._statusId) : super(const AsyncValue.loading()) {
    load();
  }

  Future<void> load() async {
    state = const AsyncValue.loading();
    try {
      // In real implementation, would call getStatusById
      // For now, get from cache
      final allStatuses = await _getStatusesUseCase.execute();
      final status = allStatuses.firstWhere((s) => s.id == _statusId, orElse: () => null);
      state = AsyncValue.data(status);
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
    }
  }

  void updateStatus(Status status) {
    state = AsyncValue.data(status);
  }
}

final currentUserProvider = StateProvider<CurrentUser?>((ref) => null);

class CurrentUser {
  final String id;
  final String phoneNumber;
  final String? displayName;
  final String? avatarUrl;

  const CurrentUser({
    required this.id,
    required this.phoneNumber,
    this.displayName,
    this.avatarUrl,
  });
}