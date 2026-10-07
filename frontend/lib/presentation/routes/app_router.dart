import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/app_theme.dart';
import '../../presentation/shared/providers/app_providers.dart';
import '../features/auth/screens/welcome_screen.dart';
import '../features/auth/screens/phone_input_screen.dart';
import '../features/auth/screens/otp_verification_screen.dart';
import '../features/auth/screens/profile_setup_screen.dart';
import '../features/conversations/presentation/screens/conversations_screen.dart';
import '../features/messaging/presentation/screens/chat_screen.dart';
import '../features/groups/presentation/screens/group_create_screen.dart';
import '../features/groups/presentation/screens/group_info_screen.dart';
import '../features/groups/presentation/screens/group_members_screen.dart';
import '../features/groups/presentation/screens/group_settings_screen.dart';
import '../features/settings/screens/settings_screen.dart';
import '../features/profile/screens/profile_screen.dart';

final appRouterProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authStateProvider);

  return GoRouter(
    initialLocation: '/welcome',
    debugLogDiagnostics: true,
    redirect: (context, state) {
      final isAuthenticated = authState == AuthState.authenticated;
      final isAuthRoute = state.matchedLocation.startsWith('/welcome') ||
          state.matchedLocation.startsWith('/phone') ||
          state.matchedLocation.startsWith('/otp') ||
          state.matchedLocation.startsWith('/profile-setup');

      if (!isAuthenticated && !isAuthRoute) {
        return '/welcome';
      }

      if (isAuthenticated && isAuthRoute) {
        return '/chats';
      }

      return null;
    },
    routes: [
      GoRoute(
        path: '/welcome',
        name: 'welcome',
        builder: (context, state) => const WelcomeScreen(),
      ),
      GoRoute(
        path: '/phone',
        name: 'phone',
        builder: (context, state) => const PhoneInputScreen(),
      ),
      GoRoute(
        path: '/otp',
        name: 'otp',
        builder: (context, state) {
          final phoneNumber = state.uri.queryParameters['phone'] ?? '';
          return OtpVerificationScreen(phoneNumber: phoneNumber);
        },
      ),
      GoRoute(
        path: '/profile-setup',
        name: 'profile-setup',
        builder: (context, state) => const ProfileSetupScreen(),
      ),
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) {
          return MainShell(navigationShell: navigationShell);
        },
        branches: [
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/chats',
                name: 'chats',
                builder: (context, state) => const ConversationsScreen(),
              ),
              GoRoute(
                path: '/chat/:conversationId',
                name: 'chat',
                builder: (context, state) {
                  final conversationId = state.pathParameters['conversationId']!;
                  return ChatScreen(conversationId: conversationId);
                },
              ),
              GoRoute(
                path: '/groups/create',
                name: 'group-create',
                builder: (context, state) => const GroupCreateScreen(),
              ),
              GoRoute(
                path: '/groups/:groupId',
                name: 'group-info',
                builder: (context, state) {
                  final groupId = state.pathParameters['groupId']!;
                  return GroupInfoScreen(groupId: groupId);
                },
              ),
              GoRoute(
                path: '/groups/:groupId/members',
                name: 'group-members',
                builder: (context, state) {
                  final groupId = state.pathParameters['groupId']!;
                  final manage = state.uri.queryParameters['manage'] == 'true';
                  return GroupMembersScreen(groupId: groupId, manageAdmins: manage);
                },
              ),
              GoRoute(
                path: '/groups/:groupId/settings',
                name: 'group-settings',
                builder: (context, state) {
                  final groupId = state.pathParameters['groupId']!;
                  return GroupSettingsScreen(groupId: groupId);
                },
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/status',
                name: 'status',
                builder: (context, state) => const Placeholder(key: Key('status')),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/calls',
                name: 'calls',
                builder: (context, state) => const Placeholder(key: Key('calls')),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/settings',
                name: 'settings',
                builder: (context, state) => const SettingsScreen(),
              ),
            ],
          ),
        ],
      ),
    ],
  );
});

class MainShell extends ConsumerWidget {
  final StatefulNavigationShell navigationShell;

  const MainShell({super.key, required this.navigationShell});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      body: navigationShell,
      bottomNavigationBar: NavigationBar(
        selectedIndex: navigationShell.currentIndex,
        onDestinationSelected: (index) {
          navigationShell.goBranch(index);
        },
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.chat_bubble_outline),
            selectedIcon: Icon(Icons.chat_bubble),
            label: 'Chats',
          ),
          NavigationDestination(
            icon: Icon(Icons.circle_outlined),
            selectedIcon: Icon(Icons.circle),
            label: 'Status',
          ),
          NavigationDestination(
            icon: Icon(Icons.call_outlined),
            selectedIcon: Icon(Icons.call),
            label: 'Calls',
          ),
          NavigationDestination(
            icon: Icon(Icons.settings_outlined),
            selectedIcon: Icon(Icons.settings),
            label: 'Settings',
          ),
        ],
      ),
    );
  }
}