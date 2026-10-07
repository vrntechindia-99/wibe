import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/conversation_repository_impl.dart';
import '../../domain/repositories/conversation_repository.dart';
import '../../domain/usecases/get_conversations_usecase.dart';
import '../../domain/usecases/pin_conversation_usecase.dart';
import '../../domain/usecases/unpin_conversation_usecase.dart';
import '../../domain/usecases/mute_conversation_usecase.dart';
import '../../domain/usecases/unmute_conversation_usecase.dart';
import '../../domain/usecases/archive_conversation_usecase.dart';
import '../../domain/usecases/unarchive_conversation_usecase.dart';
import '../../domain/usecases/mark_unread_usecase.dart';
import '../../../../core/di/injection.dart';

final conversationRepositoryProvider = Provider<ConversationRepository>((ref) {
  return getIt<ConversationRepository>();
});

final getConversationsUseCaseProvider = Provider<GetConversationsUseCase>((ref) {
  return GetConversationsUseCase(ref.read(conversationRepositoryProvider));
});

final pinConversationUseCaseProvider = Provider<PinConversationUseCase>((ref) {
  return PinConversationUseCase(ref.read(conversationRepositoryProvider));
});

final unpinConversationUseCaseProvider = Provider<UnpinConversationUseCase>((ref) {
  return UnpinConversationUseCase(ref.read(conversationRepositoryProvider));
});

final muteConversationUseCaseProvider = Provider<MuteConversationUseCase>((ref) {
  return MuteConversationUseCase(ref.read(conversationRepositoryProvider));
});

final unmuteConversationUseCaseProvider = Provider<UnmuteConversationUseCase>((ref) {
  return UnmuteConversationUseCase(ref.read(conversationRepositoryProvider));
});

final archiveConversationUseCaseProvider = Provider<ArchiveConversationUseCase>((ref) {
  return ArchiveConversationUseCase(ref.read(conversationRepositoryProvider));
});

final unarchiveConversationUseCaseProvider = Provider<UnarchiveConversationUseCase>((ref) {
  return UnarchiveConversationUseCase(ref.read(conversationRepositoryProvider));
});

final markUnreadUseCaseProvider = Provider<MarkUnreadUseCase>((ref) {
  return MarkUnreadUseCase(ref.read(conversationRepositoryProvider));
});

// State providers
final conversationsProvider = StateNotifierProvider<ConversationsNotifier, AsyncValue<List<Conversation>>>((ref) {
  return ConversationsNotifier(ref.read(getConversationsUseCaseProvider));
});

class ConversationsNotifier extends StateNotifier<AsyncValue<List<Conversation>>> {
  final GetConversationsUseCase _getConversationsUseCase;

  ConversationsNotifier(this._getConversationsUseCase) : super(const AsyncValue.loading()) {
    load();
  }

  Future<void> load({bool includeArchived = false}) async {
    state = const AsyncValue.loading();
    try {
      final conversations = await _getConversationsUseCase.execute(includeArchived: includeArchived);
      state = AsyncValue.data(conversations);
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
    }
  }

  void addConversation(Conversation conversation) {
    state = state.whenData((list) => [conversation, ...list]);
  }

  void updateConversation(Conversation conversation) {
    state = state.whenData((list) => list.map((c) => c.id == conversation.id ? conversation : c).toList());
  }

  void removeConversation(String conversationId) {
    state = state.whenData((list) => list.where((c) => c.id != conversationId).toList());
  }
}

final searchQueryProvider = StateProvider<String>((ref) => '');

final filteredConversationsProvider = Provider<AsyncValue<List<Conversation>>>((ref) {
  final conversations = ref.watch(conversationsProvider);
  final query = ref.watch(searchQueryProvider);

  return conversations.whenData((list) {
    if (query.isEmpty) return list;
    final lowerQuery = query.toLowerCase();
    return list.where((c) =>
      c.getDisplayName('').toLowerCase().contains(lowerQuery) ||
      c.lastMessage?.content?.toLowerCase().contains(lowerQuery) == true
    ).toList();
  });
});