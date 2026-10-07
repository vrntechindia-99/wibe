import 'dart:io';

import 'package:drift/drift.dart';
import 'package:drift/native.dart';
import 'package:path_provider/path_provider.dart';
import 'package:path/path.dart' as p;
import 'package:sqlite3/sqlite3.dart';
import 'package:sqlite3_flutter_libs/sqlite3_flutter_libs.dart';

part 'local_database.g.dart';

class Conversations extends Table {
  IntColumn get id => integer().autoIncrement()();
  TextColumn get conversationId => text().unique()();
  TextColumn get type => text().withDefault(const Constant('DIRECT'))();
  TextColumn get name => text().nullable()();
  TextColumn get avatarUrl => text().nullable()();
  TextColumn get lastMessageId => text().nullable()();
  TextColumn get lastMessageContent => text().nullable()();
  TextColumn get lastMessageType => text().nullable()();
  DateTimeColumn get lastMessageAt => dateTime().nullable()();
  IntColumn get unreadCount => integer().withDefault(const Constant(0))();
  BoolColumn get isPinned => boolean().withDefault(const Constant(false))();
  BoolColumn get isArchived => boolean().withDefault(const Constant(false))();
  BoolColumn get isMuted => boolean().withDefault(const Constant(false))();
  DateTimeColumn get muteUntil => dateTime().nullable()();
  DateTimeColumn get createdAt => dateTime().withDefault(currentDateTime)();
  DateTimeColumn get updatedAt => dateTime().withDefault(currentDateTime)();
}

class Messages extends Table {
  IntColumn get id => integer().autoIncrement()();
  TextColumn get messageId => text().unique()();
  TextColumn get clientMessageId => text().unique()();
  TextColumn get conversationId => text()();
  TextColumn get senderId => text()();
  TextColumn get type => text().withDefault(const Constant('TEXT'))();
  TextColumn get content => text().nullable()();
  TextColumn get status => text().withDefault(const Constant('CREATED'))();
  TextColumn get replyToId => text().nullable()();
  BoolColumn get isEdited => boolean().withDefault(const Constant(false))();
  DateTimeColumn get editedAt => dateTime().nullable()();
  BoolColumn get isDeleted => boolean().withDefault(const Constant(false))();
  BoolColumn get deletedForEveryone => boolean().withDefault(const Constant(false))();
  DateTimeColumn get createdAt => dateTime().withDefault(currentDateTime)();
  DateTimeColumn get updatedAt => dateTime().withDefault(currentDateTime)();
}

class MessageAttachments extends Table {
  IntColumn get id => integer().autoIncrement()();
  TextColumn get attachmentId => text().unique()();
  TextColumn get messageId => text()();
  TextColumn get type => text()();
  TextColumn get url => text()();
  TextColumn get thumbnailUrl => text().nullable()();
  TextColumn get fileName => text().nullable()();
  TextColumn get mimeType => text()();
  IntColumn get fileSize => integer()();
  IntColumn get width => integer().nullable()();
  IntColumn get height => integer().nullable()();
  IntColumn get duration => integer().nullable()();
  DateTimeColumn get createdAt => dateTime().withDefault(currentDateTime)();
}

class Users extends Table {
  IntColumn get id => integer().autoIncrement()();
  TextColumn get userId => text().unique()();
  TextColumn get phoneNumber => text()();
  TextColumn get displayName => text().nullable()();
  TextColumn get avatarUrl => text().nullable()();
  TextColumn get about => text().nullable()();
  BoolColumn get isVerified => boolean().withDefault(const Constant(false))();
  DateTimeColumn get createdAt => dateTime().withDefault(currentDateTime)();
}

class PendingMessages extends Table {
  IntColumn get id => integer().autoIncrement()();
  TextColumn get clientMessageId => text().unique()();
  TextColumn get conversationId => text()();
  TextColumn get type => text()();
  TextColumn get content => text().nullable()();
  TextColumn get replyToId => text().nullable()();
  BlobColumn get attachmentData => blob().nullable()();
  TextColumn get attachmentType => text().nullable()();
  TextColumn get attachmentName => text().nullable()();
  TextColumn get attachmentMimeType => text().nullable()();
  IntColumn get retryCount => integer().withDefault(const Constant(0))();
  DateTimeColumn get createdAt => dateTime().withDefault(currentDateTime)();
  DateTimeColumn get lastRetryAt => dateTime().nullable()();
}

@DriftDatabase(tables: [
  Conversations,
  Messages,
  MessageAttachments,
  Users,
  PendingMessages,
])
class LocalDatabase extends _$LocalDatabase {
  LocalDatabase.connect(QueryExecutor executor) : super(executor);

  @override
  int get schemaVersion => 1;

  @override
  MigrationStrategy get migration => MigrationStrategy(
        onCreate: (Migrator m) async {
          await m.createAll();
        },
        onUpgrade: (Migrator m, int from, int to) async {
          // Handle migrations
        },
      );

  // Conversation operations
  Future<int> insertConversation(ConversationsCompanion conversation) {
    return into(conversations).insert(conversation);
  }

  Future<void> updateConversation(ConversationsCompanion conversation) {
    return update(conversations).replace(conversation);
  }

  Future<List<Conversation>> getConversations({bool includeArchived = false}) {
    final query = select(conversations);
    if (!includeArchived) {
      query.where((c) => c.isArchived.equals(false));
    }
    query.orderBy([
      (c) => OrderingTerm(expression: c.isPinned, mode: OrderingMode.desc),
      (c) => OrderingTerm(expression: c.lastMessageAt, mode: OrderingMode.desc),
    ]);
    return query.get();
  }

  Future<Conversation?> getConversation(String conversationId) {
    return (select(conversations)..where((c) => c.conversationId.equals(conversationId))).getSingleOrNull();
  }

  // Message operations
  Future<int> insertMessage(MessagesCompanion message) {
    return into(messages).insert(message);
  }

  Future<void> updateMessage(MessagesCompanion message) {
    return update(messages).replace(message);
  }

  Future<List<Message>> getMessages(String conversationId, {int limit = 50, int offset = 0}) {
    return (select(messages)
          ..where((m) => m.conversationId.equals(conversationId))
          ..orderBy([(m) => OrderingTerm(expression: m.createdAt, mode: OrderingMode.desc)])
          ..limit(limit, offset: offset))
        .get();
  }

  Future<Message?> getMessage(String messageId) {
    return (select(messages)..where((m) => m.messageId.equals(messageId))).getSingleOrNull();
  }

  Future<void> deleteMessage(String messageId) {
    return (delete(messages)..where((m) => m.messageId.equals(messageId))).go();
  }

  // Attachments
  Future<int> insertAttachment(MessageAttachmentsCompanion attachment) {
    return into(messageAttachments).insert(attachment);
  }

  Future<List<MessageAttachment>> getAttachments(String messageId) {
    return (select(messageAttachments)..where((a) => a.messageId.equals(messageId))).get();
  }

  // Users
  Future<int> insertUser(UsersCompanion user) {
    return into(users).insert(user);
  }

  Future<void> updateUser(UsersCompanion user) {
    return update(users).replace(user);
  }

  Future<User?> getUser(String userId) {
    return (select(users)..where((u) => u.userId.equals(userId))).getSingleOrNull();
  }

  // Pending messages (offline queue)
  Future<int> insertPendingMessage(PendingMessagesCompanion message) {
    return into(pendingMessages).insert(message);
  }

  Future<List<PendingMessage>> getPendingMessages() {
    return select(pendingMessages).get();
  }

  Future<void> updatePendingMessage(PendingMessagesCompanion message) {
    return update(pendingMessages).replace(message);
  }

  Future<void> deletePendingMessage(String clientMessageId) {
    return (delete(pendingMessages)..where((m) => m.clientMessageId.equals(clientMessageId))).go();
  }
}

LazyDatabase openDatabase() {
  return LazyDatabase(() async {
    final dbFolder = await getApplicationDocumentsDirectory();
    final file = File(p.join(dbFolder.path, 'wibe.sqlite'));
    
    if (Platform.isAndroid) {
      await applyWorkaroundToOpenSqlite3OnOldAndroidVersions();
    }
    
    return NativeDatabase.createInBackground(file);
  });
}