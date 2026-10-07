import 'package:dio/dio.dart';
import 'package:drift/drift.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:get_it/get_it.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:sqlite3_flutter_libs/sqlite3_flutter_libs.dart';
import 'package:path_provider/path_provider.dart';
import 'package:path/path.dart' as p;
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:sqlite3/sqlite3.dart';
import 'package:sqlite3/open.dart';

import '../network/api_client.dart';
import '../network/auth_interceptor.dart';
import '../network/connectivity_service.dart';
import '../../data/datasources/local/local_database.dart';
import '../../data/datasources/local/local_message_datasource.dart';
import '../../data/datasources/remote/remote_message_datasource.dart';
import '../../data/repositories/message_repository_impl.dart';
import '../../data/repositories/conversation_repository_impl.dart';
import '../../domain/repositories/message_repository.dart';
import '../../domain/repositories/conversation_repository.dart';
import '../../domain/usecases/send_message_usecase.dart';
import '../../domain/usecases/get_messages_usecase.dart';
import '../../domain/usecases/watch_messages_usecase.dart';
import '../../features/conversations/domain/usecases/get_conversations_usecase.dart';
import '../../features/conversations/domain/usecases/pin_conversation_usecase.dart';
import '../../features/conversations/domain/usecases/unpin_conversation_usecase.dart';
import '../../features/conversations/domain/usecases/mute_conversation_usecase.dart';
import '../../features/conversations/domain/usecases/unmute_conversation_usecase.dart';
import '../../features/conversations/domain/usecases/archive_conversation_usecase.dart';
import '../../features/conversations/domain/usecases/unarchive_conversation_usecase.dart';
import '../../features/conversations/domain/usecases/mark_unread_usecase.dart';
import '../../features/messaging/domain/usecases/send_message_usecase.dart';
import '../../features/messaging/domain/usecases/get_messages_usecase.dart';
import '../../features/messaging/domain/usecases/watch_messages_usecase.dart';
import '../../features/messaging/domain/usecases/edit_message_usecase.dart';
import '../../features/messaging/domain/usecases/delete_message_usecase.dart';
import '../../features/media/data/datasources/remote_media_datasource.dart';
import '../../features/media/data/datasources/local_media_datasource.dart';
import '../../features/media/data/repositories/media_repository_impl.dart';
import '../../features/media/domain/repositories/media_repository.dart';
import '../../features/media/domain/usecases/create_upload_session_usecase.dart';
import '../../features/media/domain/usecases/complete_upload_usecase.dart';
import '../../features/media/domain/usecases/get_conversation_media_usecase.dart';
import '../../features/groups/data/repositories/group_repository_impl.dart';
import '../../features/groups/domain/repositories/group_repository.dart';
import '../../features/groups/domain/usecases/create_group_usecase.dart';
import '../../features/groups/domain/usecases/get_groups_usecase.dart';
import '../../features/groups/domain/usecases/get_group_usecase.dart';
import '../../features/groups/domain/usecases/update_group_usecase.dart';
import '../../features/groups/domain/usecases/update_group_settings_usecase.dart';
import '../../features/groups/domain/usecases/add_members_usecase.dart';
import '../../features/groups/domain/usecases/remove_member_usecase.dart';
import '../../features/groups/domain/usecases/leave_group_usecase.dart';
import '../../features/groups/domain/usecases/promote_admin_usecase.dart';
import '../../features/groups/domain/usecases/demote_admin_usecase.dart';
import '../../features/groups/domain/usecases/search_groups_usecase.dart';
import '../../features/groups/domain/usecases/get_group_usecase.dart';
import '../../features/groups/domain/usecases/get_group_members_usecase.dart';
import '../../features/groups/domain/usecases/leave_group_usecase.dart';
import '../../features/groups/domain/usecases/delete_group_usecase.dart';
import '../../features/status/data/datasources/remote_status_datasource.dart';
import '../../features/status/data/datasources/local_status_datasource.dart';
import '../../features/status/data/repositories/status_repository_impl.dart';
import '../../features/status/domain/repositories/status_repository.dart';
import '../../features/status/domain/usecases/create_status_usecase.dart';
import '../../features/status/domain/usecases/get_statuses_usecase.dart';
import '../../features/status/domain/usecases/view_status_usecase.dart';
import '../../features/status/domain/usecases/reply_to_status_usecase.dart';
import '../../features/status/domain/usecases/add_status_reaction_usecase.dart';
import '../../features/status/domain/usecases/delete_status_usecase.dart';
import '../../features/calls/data/datasources/remote_calls_datasource.dart';
import '../../features/calls/data/datasources/local_calls_datasource.dart';
import '../../features/calls/data/repositories/calls_repository_impl.dart';
import '../../features/calls/domain/repositories/calls_repository.dart';
import '../../features/calls/domain/usecases/start_call_usecase.dart';
import '../../features/calls/domain/usecases/accept_call_usecase.dart';
import '../../features/calls/domain/usecases/decline_call_usecase.dart';
import '../../features/calls/domain/usecases/cancel_call_usecase.dart';
import '../../features/calls/domain/usecases/end_call_usecase.dart';
import '../../features/calls/domain/usecases/get_call_usecase.dart';
import '../../features/calls/domain/usecases/get_active_call_usecase.dart';
import '../../features/calls/domain/usecases/get_call_history_usecase.dart';

final getIt = GetIt.instance;

Future<void> configureDependencies() async {
  // Core
  getIt.registerLazySingleton<Connectivity>(() => Connectivity());
  getIt.registerLazySingleton<ConnectivityService>(
    () => ConnectivityService(getIt<Connectivity>()),
  );

  // Secure Storage
  getIt.registerLazySingleton<FlutterSecureStorage>(
    () => const FlutterSecureStorage(
      aOptions: AndroidOptions(encryptedSharedPreferences: true),
      iOptions: IOSOptions(accessibility: KeychainAccessibility.first_unlock_this_device),
    ),
  );

  // Database
  final db = await _initDatabase();
  getIt.registerSingleton<LocalDatabase>(db);

  // Network
  final dio = _createDio();
  getIt.registerLazySingleton<Dio>(() => dio);
  getIt.registerLazySingleton<ApiClient>(() => ApiClient(dio));

  // Data Sources
  getIt.registerLazySingleton<LocalMessageDataSource>(
    () => LocalMessageDataSource(getIt<LocalDatabase>()),
  );
  getIt.registerLazySingleton<RemoteMessageDataSource>(
    () => RemoteMessageDataSource(getIt<ApiClient>()),
  );
  getIt.registerLazySingleton<RemoteMediaDataSource>(
    () => RemoteMediaDataSource(getIt<ApiClient>()),
  );
  getIt.registerLazySingleton<LocalMediaDataSource>(
    () => LocalMediaDataSource(getIt<LocalDatabase>()),
  );
  getIt.registerLazySingleton<RemoteStatusDataSource>(
    () => RemoteStatusDataSource(getIt<ApiClient>()),
  );
  getIt.registerLazySingleton<LocalStatusDataSource>(
    () => LocalStatusDataSource(getIt<LocalDatabase>()),
  );
  getIt.registerLazySingleton<RemoteCallsDataSource>(
    () => RemoteCallsDataSource(getIt<ApiClient>()),
  );
  getIt.registerLazySingleton<LocalCallsDataSource>(
    () => LocalCallsDataSource(getIt<LocalDatabase>()),
  );

  // Repositories
  getIt.registerLazySingleton<MessageRepository>(
    () => MessageRepositoryImpl(
      localDataSource: getIt<LocalMessageDataSource>(),
      remoteDataSource: getIt<RemoteMessageDataSource>(),
      connectivityService: getIt<ConnectivityService>(),
    ),
  );
  getIt.registerLazySingleton<ConversationRepository>(
    () => ConversationRepositoryImpl(
      remoteDataSource: getIt<RemoteMessageDataSource>(),
      localDataSource: getIt<LocalMessageDataSource>(),
      connectivityService: getIt<ConnectivityService>(),
    ),
  );
  getIt.registerLazySingleton<MediaRepository>(
    () => MediaRepositoryImpl(
      remoteDataSource: getIt<RemoteMediaDataSource>(),
      localDataSource: getIt<LocalMediaDataSource>(),
      connectivityService: getIt<ConnectivityService>(),
    ),
  );
  getIt.registerLazySingleton<GroupRepository>(
    () => GroupRepositoryImpl(
      remoteDataSource: getIt<RemoteMessageDataSource>(),
      localDataSource: getIt<LocalMessageDataSource>(),
      connectivityService: getIt<ConnectivityService>(),
    ),
  );
  getIt.registerLazySingleton<StatusRepository>(
    () => StatusRepositoryImpl(
      remoteDataSource: getIt<RemoteStatusDataSource>(),
      localDataSource: getIt<LocalStatusDataSource>(),
      connectivityService: getIt<ConnectivityService>(),
    ),
  );
  getIt.registerLazySingleton<CallsRepository>(
    () => CallsRepositoryImpl(
      remoteDataSource: getIt<RemoteCallsDataSource>(),
      localDataSource: getIt<LocalCallsDataSource>(),
      connectivityService: getIt<ConnectivityService>(),
    ),
  );

  // Use Cases
  getIt.registerLazySingleton<SendMessageUseCase>(
    () => SendMessageUseCase(getIt<MessageRepository>()),
  );
  getIt.registerLazySingleton<GetMessagesUseCase>(
    () => GetMessagesUseCase(getIt<MessageRepository>()),
  );
  getIt.registerLazySingleton<WatchMessagesUseCase>(
    () => WatchMessagesUseCase(getIt<MessageRepository>()),
  );
  getIt.registerLazySingleton<GetConversationsUseCase>(
    () => GetConversationsUseCase(getIt<ConversationRepository>()),
  );
  getIt.registerLazySingleton<PinConversationUseCase>(
    () => PinConversationUseCase(getIt<ConversationRepository>()),
  );
  getIt.registerLazySingleton<UnpinConversationUseCase>(
    () => UnpinConversationUseCase(getIt<ConversationRepository>()),
  );
  getIt.registerLazySingleton<MuteConversationUseCase>(
    () => MuteConversationUseCase(getIt<ConversationRepository>()),
  );
  getIt.registerLazySingleton<UnmuteConversationUseCase>(
    () => UnmuteConversationUseCase(getIt<ConversationRepository>()),
  );
  getIt.registerLazySingleton<ArchiveConversationUseCase>(
    () => ArchiveConversationUseCase(getIt<ConversationRepository>()),
  );
  getIt.registerLazySingleton<UnarchiveConversationUseCase>(
    () => UnarchiveConversationUseCase(getIt<ConversationRepository>()),
  );
  getIt.registerLazySingleton<MarkUnreadUseCase>(
    () => MarkUnreadUseCase(getIt<ConversationRepository>()),
  );
  getIt.registerLazySingleton<EditMessageUseCase>(
    () => EditMessageUseCase(getIt<MessageRepository>()),
  );
  getIt.registerLazySingleton<DeleteMessageUseCase>(
    () => DeleteMessageUseCase(getIt<MessageRepository>()),
  );
  getIt.registerLazySingleton<CreateUploadSessionUseCase>(
    () => CreateUploadSessionUseCase(getIt<MediaRepository>()),
  );
  getIt.registerLazySingleton<CompleteUploadUseCase>(
    () => CompleteUploadUseCase(getIt<MediaRepository>()),
  );
  getIt.registerLazySingleton<GetConversationMediaUseCase>(
    () => GetConversationMediaUseCase(getIt<MediaRepository>()),
  );
  getIt.registerLazySingleton<CreateGroupUseCase>(
    () => CreateGroupUseCase(getIt<GroupRepository>()),
  );
  getIt.registerLazySingleton<GetGroupsUseCase>(
    () => GetGroupsUseCase(getIt<GroupRepository>()),
  );
  getIt.registerLazySingleton<GetGroupUseCase>(
    () => GetGroupUseCase(getIt<GroupRepository>()),
  );
  getIt.registerLazySingleton<UpdateGroupUseCase>(
    () => UpdateGroupUseCase(getIt<GroupRepository>()),
  );
  getIt.registerLazySingleton<UpdateGroupSettingsUseCase>(
    () => UpdateGroupSettingsUseCase(getIt<GroupRepository>()),
  );
  getIt.registerLazySingleton<AddMembersUseCase>(
    () => AddMembersUseCase(getIt<GroupRepository>()),
  );
  getIt.registerLazySingleton<RemoveMemberUseCase>(
    () => RemoveMemberUseCase(getIt<GroupRepository>()),
  );
  getIt.registerLazySingleton<LeaveGroupUseCase>(
    () => LeaveGroupUseCase(getIt<GroupRepository>()),
  );
  getIt.registerLazySingleton<PromoteAdminUseCase>(
    () => PromoteAdminUseCase(getIt<GroupRepository>()),
  );
  getIt.registerLazySingleton<DemoteAdminUseCase>(
    () => DemoteAdminUseCase(getIt<GroupRepository>()),
  );
  getIt.registerLazySingleton<SearchGroupsUseCase>(
    () => SearchGroupsUseCase(getIt<GroupRepository>()),
  );
  getIt.registerLazySingleton<GetGroupUseCase>(
    () => GetGroupUseCase(getIt<GroupRepository>()),
  );
  getIt.registerLazySingleton<GetGroupMembersUseCase>(
    () => GetGroupMembersUseCase(getIt<GroupRepository>()),
  );
  getIt.registerLazySingleton<LeaveGroupUseCase>(
    () => LeaveGroupUseCase(getIt<GroupRepository>()),
  );
  getIt.registerLazySingleton<DeleteGroupUseCase>(
    () => DeleteGroupUseCase(getIt<GroupRepository>()),
  );
  getIt.registerLazySingleton<CreateStatusUseCase>(
    () => CreateStatusUseCase(getIt<StatusRepository>()),
  );
  getIt.registerLazySingleton<GetStatusesUseCase>(
    () => GetStatusesUseCase(getIt<StatusRepository>()),
  );
  getIt.registerLazySingleton<ViewStatusUseCase>(
    () => ViewStatusUseCase(getIt<StatusRepository>()),
  );
  getIt.registerLazySingleton<ReplyToStatusUseCase>(
    () => ReplyToStatusUseCase(getIt<StatusRepository>()),
  );
  getIt.registerLazySingleton<AddStatusReactionUseCase>(
    () => AddStatusReactionUseCase(getIt<StatusRepository>()),
  );
  getIt.registerLazySingleton<DeleteStatusUseCase>(
    () => DeleteStatusUseCase(getIt<StatusRepository>()),
  );
  getIt.registerLazySingleton<StartCallUseCase>(
    () => StartCallUseCase(getIt<CallsRepository>()),
  );
  getIt.registerLazySingleton<AcceptCallUseCase>(
    () => AcceptCallUseCase(getIt<CallsRepository>()),
  );
  getIt.registerLazySingleton<DeclineCallUseCase>(
    () => DeclineCallUseCase(getIt<CallsRepository>()),
  );
  getIt.registerLazySingleton<CancelCallUseCase>(
    () => CancelCallUseCase(getIt<CallsRepository>()),
  );
  getIt.registerLazySingleton<EndCallUseCase>(
    () => EndCallUseCase(getIt<CallsRepository>()),
  );
  getIt.registerLazySingleton<GetCallUseCase>(
    () => GetCallUseCase(getIt<CallsRepository>()),
  );
  getIt.registerLazySingleton<GetActiveCallUseCase>(
    () => GetActiveCallUseCase(getIt<CallsRepository>()),
  );
  getIt.registerLazySingleton<GetCallHistoryUseCase>(
    () => GetCallHistoryUseCase(getIt<CallsRepository>()),
  );
}

Dio _createDio() {
  final dio = Dio(
    BaseOptions(
      baseUrl: 'http://10.0.2.2:3000/api/v1', // Android emulator localhost
      connectTimeout: const Duration(seconds: 30),
      receiveTimeout: const Duration(seconds: 30),
      sendTimeout: const Duration(seconds: 30),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    ),
  );

  dio.interceptors.add(AuthInterceptor(getIt<FlutterSecureStorage>()));
  dio.interceptors.add(PrettyDioLogger(
    requestHeader: true,
    requestBody: true,
    responseHeader: false,
    responseBody: true,
    error: true,
  ));

  return dio;
}

Future<LocalDatabase> _initDatabase() async {
  final docsDir = await getApplicationDocumentsDirectory();
  final dbPath = p.join(docsDir.path, 'wibe.sqlite');

  return LocalDatabase.connect(
    LazyDatabase(() async {
      // Open sqlite3
      final sqlite3 = open.overrideFor(defaultTargetPlatform);
      return sqlite3.openDatabase(dbPath);
    }),
  );
}