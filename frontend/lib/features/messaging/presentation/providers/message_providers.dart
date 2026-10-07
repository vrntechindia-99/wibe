import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/message_repository_impl.dart';
import '../../domain/repositories/message_repository.dart';
import '../../domain/usecases/send_message_usecase.dart';
import '../../domain/usecases/get_messages_usecase.dart';
import '../../domain/usecases/watch_messages_usecase.dart';
import '../../domain/usecases/edit_message_usecase.dart';
import '../../domain/usecases/delete_message_usecase.dart';
import '../../../../core/di/injection.dart';

final messageRepositoryProvider = Provider<MessageRepository>((ref) {
  return getIt<MessageRepository>();
});

final sendMessageUseCaseProvider = Provider<SendMessageUseCase>((ref) {
  return SendMessageUseCase(ref.read(messageRepositoryProvider));
});

final getMessagesUseCaseProvider = Provider<GetMessagesUseCase>((ref) {
  return GetMessagesUseCase(ref.read(messageRepositoryProvider));
});

final watchMessagesUseCaseProvider = Provider<WatchMessagesUseCase>((ref) {
  return WatchMessagesUseCase(ref.read(messageRepositoryProvider));
});

final editMessageUseCaseProvider = Provider<EditMessageUseCase>((ref) {
  return EditMessageUseCase(ref.read(messageRepositoryProvider));
});

final deleteMessageUseCaseProvider = Provider<DeleteMessageUseCase>((ref) {
  return DeleteMessageUseCase(ref.read(messageRepositoryProvider));
});

// State providers
final messagesProvider = StateNotifierProvider.family<MessagesNotifier, AsyncValue<List<Message>>, String>((ref, conversationId) {
  return MessagesNotifier(
    ref.read(getMessagesUseCaseProvider),
    ref.read(watchMessagesUseCaseProvider),
    conversationId,
  );
});

class MessagesNotifier extends StateNotifier<AsyncValue<List<Message>>> {
  final GetMessagesUseCase _getMessagesUseCase;
  final WatchMessagesUseCase _watchMessagesUseCase;
  final String _conversationId;
  StreamSubscription? _subscription;

  MessagesNotifier(
    this._getMessagesUseCase,
    this._watchMessagesUseCase,
    this._conversationId,
  ) : super(const AsyncValue.loading()) {
    load();
    _watch();
  }

  Future<void> load({int limit = 50, int offset = 0}) async {
    state = const AsyncValue.loading();
    try {
      final messages = await _getMessagesUseCase.execute(_conversationId, limit: limit, offset: offset);
      state = AsyncValue.data(messages);
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
    }
  }

  void _watch() {
    _subscription = _watchMessagesUseCase.execute(_conversationId).listen(
      (messages) {
        state = AsyncValue.data(messages);
      },
      onError: (error) {
        state = AsyncValue.error(error, StackTrace.current);
      },
    );
  }

  void addMessage(Message message) {
    state = state.whenData((list) => [...list, message]);
  }

  void updateMessage(Message message) {
    state = state.whenData((list) => list.map((m) => m.id == message.id ? message : m).toList());
  }

  void removeMessage(String messageId) {
    state = state.whenData((list) => list.where((m) => m.id != messageId).toList());
  }

  void updateMessageStatus(String messageId, MessageStatus status) {
    state = state.whenData((list) => list.map((m) {
      if (m.id == messageId) {
        return m.copyWith(status: status);
      }
      return m;
    }).toList());
  }

  @override
  void dispose() {
    _subscription?.cancel();
    super.dispose();
  }
}

final typingUsersProvider = StateProvider<Map<String, Set<String>>>((ref) => {});
// conversationId -> Set of userIds typing

final replyingToProvider = StateProvider<Message?>((ref) => null);