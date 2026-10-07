"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const throttler_1 = require("@nestjs/throttler");
const core_1 = require("@nestjs/core");
const schedule_1 = require("@nestjs/schedule");
const prisma_module_1 = require("./shared/database/prisma.module");
const redis_module_1 = require("./shared/database/redis.module");
const auth_module_1 = require("./modules/auth/auth.module");
const users_module_1 = require("./modules/users/users.module");
const conversations_module_1 = require("./modules/conversations/conversations.module");
const messages_module_1 = require("./modules/messages/messages.module");
const groups_module_1 = require("./modules/groups/groups.module");
const media_module_1 = require("./modules/media/media.module");
const voice_messages_module_1 = require("./modules/voice-messages/voice-messages.module");
const presence_module_1 = require("./modules/presence/presence.module");
const notifications_module_1 = require("./modules/notifications/notifications.module");
const calls_module_1 = require("./modules/calls/calls.module");
const status_module_1 = require("./modules/status/status.module");
const admin_module_1 = require("./modules/admin/admin.module");
const search_module_1 = require("./modules/search/search.module");
const realtime_module_1 = require("./modules/realtime/realtime.module");
const websocket_module_1 = require("./shared/websocket/websocket.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: ['.env.local', '.env'],
                cache: true,
            }),
            throttler_1.ThrottlerModule.forRootAsync({
                imports: [config_1.ConfigModule],
                useFactory: (configService) => ({
                    throttlers: [
                        {
                            ttl: configService.get('RATE_LIMIT_WINDOW_MS') || 900000,
                            limit: configService.get('RATE_LIMIT_MAX_REQUESTS') || 100,
                        },
                    ],
                }),
                inject: [config_1.ConfigService],
            }),
            schedule_1.ScheduleModule.forRoot(),
            prisma_module_1.PrismaModule,
            redis_module_1.RedisModule,
            websocket_module_1.WebSocketModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            conversations_module_1.ConversationsModule,
            messages_module_1.MessagesModule,
            groups_module_1.GroupsModule,
            media_module_1.MediaModule,
            voice_messages_module_1.VoiceMessagesModule,
            presence_module_1.PresenceModule,
            notifications_module_1.NotificationsModule,
            calls_module_1.CallsModule,
            status_module_1.StatusModule,
            admin_module_1.AdminModule,
            search_module_1.SearchModule,
            realtime_module_1.RealtimeModule,
        ],
        providers: [
            {
                provide: core_1.APP_GUARD,
                useClass: throttler_1.ThrottlerGuard,
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map