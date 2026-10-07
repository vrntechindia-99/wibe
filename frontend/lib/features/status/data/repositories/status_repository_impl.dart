import '../../domain/repositories/status_repository.dart';
import '../../domain/entities/status.dart';
import '../datasources/remote_status_datasource.dart';
import '../datasources/local_status_datasource.dart';
import '../../../../core/network/connectivity_service.dart';

class StatusRepositoryImpl implements StatusRepository {
  final RemoteStatusDataSource _remoteDataSource;
  final LocalStatusDataSource _localDataSource;
  final ConnectivityService _connectivityService;

  StatusRepositoryImpl(
    this._remoteDataSource,
    this._localDataSource,
    this._connectivityService,
  );

  @override
  Future<Status> createStatus({
    required StatusType type,
    required String privacy,
    String? content,
    String? mediaUrl,
    String? thumbnailUrl,
    List<String>? selectedUsers,
  }) async {
    final isOnline = await _checkConnectivity();
    if (!isOnline) {
      throw Exception('Cannot create status while offline');
    }

    return _remoteDataSource.createStatus(
      type: type,
      privacy: privacy,
      content: content,
      mediaUrl: mediaUrl,
      thumbnailUrl: thumbnailUrl,
      selectedUsers: selectedUsers,
    );
  }

  @override
  Future<List<Status>> getContactStatuses() async {
    final isOnline = await _checkConnectivity();

    if (isOnline) {
      try {
        return await _remoteDataSource.getContactStatuses();
      } catch (_) {
        // Fall back to local
      }
    }

    return _localDataSource.getContactStatuses();
  }

  @override
  Future<List<Status>> getUserStatuses(String userId) async {
    final isOnline = await _checkConnectivity();

    if (isOnline) {
      try {
        return await _remoteDataSource.getUserStatuses(userId);
      } catch (_) {
        // Fall back to local
      }
    }

    return _localDataSource.getUserStatuses(userId);
  }

  @override
  Future<Status> getStatus(String statusId) async {
    final isOnline = await _checkConnectivity();

    if (isOnline) {
      try {
        return await _remoteDataSource.getStatus(statusId);
      } catch (_) {
        // Fall back to local
      }
    }

    return _localDataSource.getStatus(statusId);
  }

  @override
  Future<void> viewStatus(String statusId) async {
    final isOnline = await _checkConnectivity();
    if (isOnline) {
      try {
        await _remoteDataSource.viewStatus(statusId);
      } catch (_) {}
    }
  }

  @override
  Future<void> replyToStatus(String statusId, String content) async {
    final isOnline = await _checkConnectivity();
    if (isOnline) {
      try {
        await _remoteDataSource.replyToStatus(statusId, content);
      } catch (_) {
        throw Exception('Cannot reply while offline');
      }
    } else {
      throw Exception('Cannot reply while offline');
    }
  }

  @override
  Future<void> addReaction(String statusId, String emoji) async {
    final isOnline = await _checkConnectivity();
    if (isOnline) {
      try {
        await _remoteDataSource.addReaction(statusId, emoji);
      } catch (_) {}
    }
  }

  @override
  Future<void> removeReaction(String statusId, String emoji) async {
    final isOnline = await _checkConnectivity();
    if (isOnline) {
      try {
        await _remoteDataSource.removeReaction(statusId, emoji);
      } catch (_) {}
    }
  }

  @override
  Future<void> deleteStatus(String statusId) async {
    final isOnline = await _checkConnectivity();
    if (isOnline) {
      try {
        await _remoteDataSource.deleteStatus(statusId);
      } catch (_) {}
    }
    await _localDataSource.deleteStatus(statusId);
  }

  @override
  Future<Status> updateStatus(String statusId, {String? content, String? privacy, List<String>? selectedUsers}) async {
    final isOnline = await _checkConnectivity();
    if (isOnline) {
      try {
        return await _remoteDataSource.updateStatus(statusId, content: content, privacy: privacy, selectedUsers: selectedUsers);
      } catch (_) {
        throw Exception('Cannot update while offline');
      }
    } else {
      throw Exception('Cannot update while offline');
    }
  }

  Future<bool> _checkConnectivity() async {
    final result = await _connectivityService.checkConnectivity();
    return _connectivityService.isConnected(result);
  }
}