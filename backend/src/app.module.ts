import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';

import { PrismaModule } from './shared/database/prisma.module';
import { RedisModule } from './shared/database/redis.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ConversationsModule } from './modules/conversations/conversations.module';
import { MessagesModule } from './modules/messages/messages.module';
import { GroupsModule } from './modules/groups/groups.module';
import { MediaModule } from './modules/media/media.module';
import { VoiceMessagesModule } from './modules/voice-messages/voice-messages.module';
import { PresenceModule } from './modules/presence/presence.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { CallsModule } from './modules/calls/calls.module';
import { StatusModule } from './modules/status/status.module';
import { AdminModule } from './modules/admin/admin.module';
import { SearchModule } from './modules/search/search.module';
import { RealtimeModule } from './modules/realtime/realtime.module';
import { WebSocketModule } from './shared/websocket/websocket.module';
import { ReactionsModule } from './modules/reactions/reactions.module';
import { ForwardingModule } from './modules/forwarding/forwarding.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      cache: true,
    }),

    // Rate limiting
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        throttlers: [
          {
            ttl: configService.get<number>('RATE_LIMIT_WINDOW_MS') || 900000,
            limit: configService.get<number>('RATE_LIMIT_MAX_REQUESTS') || 100,
          },
        ],
      }),
      inject: [ConfigService],
    }),

    // Task scheduling
    ScheduleModule.forRoot(),

    // Database
    PrismaModule,
    RedisModule,

    // WebSocket
    WebSocketModule,

    // Feature modules
    AuthModule,
    UsersModule,
    ConversationsModule,
    MessagesModule,
    GroupsModule,
    MediaModule,
    VoiceMessagesModule,
    PresenceModule,
    NotificationsModule,
    CallsModule,
    StatusModule,
    AdminModule,
    SearchModule,
    RealtimeModule,
    ReactionsModule,
    ForwardingModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}