import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../../core/di/injection.dart';
import '../../../core/network/connectivity_service.dart';
import '../../../core/network/api_client.dart';
import '../../../domain/repositories/message_repository.dart';
import '../../../domain/usecases/send_message_usecase.dart';
import '../../../domain/usecases/get_messages_usecase.dart';
import '../../../domain/usecases/watch_messages_usecase.dart';

// Core providers
final sharedPreferencesProvider = Provider<SharedPreferences>((ref) {
  throw UnimplementedError();
});

final connectivityServiceProvider = Provider<ConnectivityService>((ref) {
  return getIt<ConnectivityService>();
});

final apiClientProvider = Provider<ApiClient>((ref) {
  return getIt<ApiClient>();
});

// Repository providers
final messageRepositoryProvider = Provider<MessageRepository>((ref) {
  return getIt<MessageRepository>();
});

// Use case providers
final sendMessageUseCaseProvider = Provider<SendMessageUseCase>((ref) {
  return getIt<SendMessageUseCase>();
});

final getMessagesUseCaseProvider = Provider<GetMessagesUseCase>((ref) {
  return getIt<GetMessagesUseCase>();
});

final watchMessagesUseCaseProvider = Provider<WatchMessagesUseCase>((ref) {
  return getIt<WatchMessagesUseCase>();
});

// Auth state
final authStateProvider = StateProvider<AuthState>((ref) => AuthState.unauthenticated);

enum AuthState { unauthenticated, authenticating, authenticated }

// Current user
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