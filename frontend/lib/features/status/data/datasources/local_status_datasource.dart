import 'package:drift/drift.dart';

import '../../domain/entities/status.dart';
import '../../../../data/datasources/local/local_database.dart';

class LocalStatusDataSource {
  final LocalDatabase _database;

  LocalStatusDataSource(this._database);

  Future<void> cacheStatus(Status status) {
    // TODO: Add status tables to local database
    // For now, this is a placeholder
    return Future.value();
  }

  Future<Status?> getStatus(String statusId) {
    // TODO: Implement
    return Future.value(null);
  }

  Future<List<Status>> getContactStatuses() {
    // TODO: Implement
    return Future.value([]);
  }

  Future<void> deleteStatus(String statusId) {
    // TODO: Implement
    return Future.value();
  }
}