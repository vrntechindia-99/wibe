"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var RealtimeGateway_1;
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RealtimeGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const ws_jwt_guard_1 = require("@shared/guards/ws-jwt.guard");
const common_2 = require("@nestjs/common");
const redis_service_1 = require("@shared/database/redis.service");
const prisma_service_1 = require("@shared/database/prisma.service");
let RealtimeGateway = RealtimeGateway_1 = class RealtimeGateway {
    constructor(jwtService, configService, redis, prisma) {
        this.jwtService = jwtService;
        this.configService = configService;
        this.redis = redis;
        this.prisma = prisma;
        this.logger = new common_1.Logger(RealtimeGateway_1.name);
    }
    async handleConnection(client) {
        try {
            const token = this.extractToken(client);
            if (!token) {
                this.logger.warn(`Connection rejected: no token - ${client.id}`);
                client.disconnect();
                return;
            }
            const secret = this.configService.get('JWT_ACCESS_SECRET');
            const payload = await this.jwtService.verifyAsync(token, { secret });
            client.user = { sub: payload.sub, deviceId: payload.deviceId };
            await this.redis.setUserOnline(payload.sub, payload.deviceId);
            client.join(`user:${payload.sub}`);
            const memberships = await this.prisma.conversationMember.findMany({
                where: { userId: payload.sub, leftAt: null },
                select: { conversationId: true },
            });
            for (const membership of memberships) {
                client.join(`conversation:${membership.conversationId}`);
            }
            const groupMemberships = await this.prisma.groupMember.findMany({
                where: { userId: payload.sub, leftAt: null },
                select: { groupId: true },
            });
            for (const membership of groupMemberships) {
                client.join(`group:${membership.groupId}`);
            }
            await this.emitPresence(payload.sub, true);
            this.logger.log(`Client connected: ${client.id} (user: ${payload.sub})`);
        }
        catch (error) {
            this.logger.warn(`Connection rejected: ${error.message} - ${client.id}`);
            client.disconnect();
        }
    }
    async handleDisconnect(client) {
        if (client.user) {
            await this.redis.setUserOffline(client.user.sub, client.user.deviceId);
            const devices = await this.redis.getUserDevices(client.user.sub);
            if (Object.keys(devices).length === 0) {
                await this.emitPresence(client.user.sub, false);
            }
        }
        this.logger.log(`Client disconnected: ${client.id}`);
    }
    async handleSubscribe(client, data) {
        const userId = client.user.sub;
        if (data.conversationIds && Array.isArray(data.conversationIds)) {
            for (const conversationId of data.conversationIds) {
                const membership = await this.prisma.conversationMember.findUnique({
                    where: { conversationId_userId: { conversationId, userId } },
                });
                if (membership && !membership.leftAt) {
                    client.join(`conversation:${conversationId}`);
                }
            }
        }
        if (data.groupIds && Array.isArray(data.groupIds)) {
            for (const groupId of data.groupIds) {
                const membership = await this.prisma.groupMember.findUnique({
                    where: { groupId_userId: { groupId, userId } },
                });
                if (membership && !membership.leftAt) {
                    client.join(`group:${groupId}`);
                }
            }
        }
        return { success: true };
    }
    async handleUnsubscribe(client, data) {
        if (data.conversationIds && Array.isArray(data.conversationIds)) {
            for (const conversationId of data.conversationIds) {
                client.leave(`conversation:${conversationId}`);
            }
        }
        if (data.groupIds && Array.isArray(data.groupIds)) {
            for (const groupId of data.groupIds) {
                client.leave(`group:${groupId}`);
            }
        }
        return { success: true };
    }
    async handleTypingStarted(client, data) {
        const { conversationId } = data;
        const userId = client.user.sub;
        const membership = await this.prisma.conversationMember.findUnique({
            where: { conversationId_userId: { conversationId, userId } },
        });
        if (!membership || membership.leftAt) {
            return { success: false, error: 'Not a member' };
        }
        await this.redis.setTyping(userId, conversationId);
        this.server.to(`conversation:${conversationId}`).emit('typing_started', {
            conversationId,
            userId,
        });
        return { success: true };
    }
    async handleTypingStopped(client, data) {
        const { conversationId } = data;
        const userId = client.user.sub;
        await this.redis.removeTyping(userId, conversationId);
        this.server.to(`conversation:${conversationId}`).emit('typing_stopped', {
            conversationId,
            userId,
        });
        return { success: true };
    }
    async handleGroupTypingStarted(client, data) {
        const { groupId } = data;
        const userId = client.user.sub;
        const membership = await this.prisma.groupMember.findUnique({
            where: { groupId_userId: { groupId, userId } },
        });
        if (!membership || membership.leftAt) {
            return { success: false, error: 'Not a member' };
        }
        await this.redis.setTyping(userId, `group:${groupId}`);
        this.server.to(`group:${groupId}`).emit('group_typing_started', {
            groupId,
            userId,
        });
        return { success: true };
    }
    async handleGroupTypingStopped(client, data) {
        const { groupId } = data;
        const userId = client.user.sub;
        await this.redis.removeTyping(userId, `group:${groupId}`);
        this.server.to(`group:${groupId}`).emit('group_typing_stopped', {
            groupId,
            userId,
        });
        return { success: true };
    }
    async handleGroupMessageRead(client, data) {
        const { groupId, messageId } = data;
        const userId = client.user.sub;
        const membership = await this.prisma.groupMember.findUnique({
            where: { groupId_userId: { groupId, userId } },
        });
        if (!membership || membership.leftAt) {
            return { success: false, error: 'Not a member' };
        }
        const group = await this.prisma.group.findUnique({
            where: { id: groupId },
            include: { conversation: true },
        });
        if (!group) {
            return { success: false, error: 'Group not found' };
        }
        await this.prisma.conversationMember.update({
            where: { conversationId_userId: { conversationId: group.conversationId, userId } },
            data: { lastReadMessageId: messageId, unreadCount: 0 },
        });
        await this.prisma.messageReadReceipt.upsert({
            where: { messageId_userId: { messageId, userId } },
            create: { messageId, userId },
            update: { readAt: new Date() },
        });
        this.server.to(`group:${groupId}`).emit('group_message_read', {
            groupId,
            messageId,
            userId,
        });
        return { success: true };
    }
    async handleGroupMessageDelivered(client, data) {
        const { groupId, messageId } = data;
        const userId = client.user.sub;
        const group = await this.prisma.group.findUnique({
            where: { id: groupId },
            include: { conversation: true },
        });
        if (!group) {
            return { success: false, error: 'Group not found' };
        }
        await this.prisma.message.update({
            where: { id: messageId },
            data: { status: 'DELIVERED' },
        });
        this.server.to(`group:${groupId}`).emit('group_message_delivered', {
            groupId,
            messageId,
            userId,
        });
        return { success: true };
    }
    handlePing() {
        return { success: true, pong: true };
    }
    async emitPresence(userId, online) {
        const event = {
            type: online ? 'user_online' : 'user_offline',
            payload: { userId, timestamp: new Date().toISOString() },
        };
        this.server.emit('presence', event);
        await this.redis.publish('presence', JSON.stringify(event));
    }
    extractToken(client) {
        const auth = client.handshake.auth;
        if (auth?.token)
            return auth.token;
        const query = client.handshake.query;
        if (query?.token)
            return query.token;
        const headers = client.handshake.headers;
        if (headers?.authorization) {
            const [type, token] = headers.authorization.split(' ');
            if (type === 'Bearer')
                return token;
        }
        return undefined;
    }
    async emitToConversation(conversationId, event, payload) {
        this.server.to(`conversation:${conversationId}`).emit(event, payload);
    }
    async emitToUser(userId, event, payload) {
        this.server.to(`user:${userId}`).emit(event, payload);
    }
    async broadcastPresence(userId, online) {
        await this.emitPresence(userId, online);
    }
    async emitGroupUpdated(groupId, payload) {
        this.server.to(`group:${groupId}`).emit('group_updated', { groupId, ...payload });
    }
    async emitMemberAdded(groupId, payload) {
        this.server.to(`group:${groupId}`).emit('member_added', { groupId, ...payload });
    }
    async emitMemberRemoved(groupId, payload) {
        this.server.to(`group:${groupId}`).emit('member_removed', { groupId, ...payload });
    }
    async emitMemberLeft(groupId, payload) {
        this.server.to(`group:${groupId}`).emit('member_left', { groupId, ...payload });
    }
    async emitMemberPromoted(groupId, payload) {
        this.server.to(`group:${groupId}`).emit('member_promoted', { groupId, ...payload });
    }
    async emitMemberDemoted(groupId, payload) {
        this.server.to(`group:${groupId}`).emit('member_demoted', { groupId, ...payload });
    }
    async emitGroupDeleted(groupId) {
        this.server.to(`group:${groupId}`).emit('group_deleted', { groupId });
    }
};
exports.RealtimeGateway = RealtimeGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], RealtimeGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('subscribe'),
    (0, common_2.UseGuards)(ws_jwt_guard_1.WsJwtGuard),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], RealtimeGateway.prototype, "handleSubscribe", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('unsubscribe'),
    (0, common_2.UseGuards)(ws_jwt_guard_1.WsJwtGuard),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], RealtimeGateway.prototype, "handleUnsubscribe", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('typing_started'),
    (0, common_2.UseGuards)(ws_jwt_guard_1.WsJwtGuard),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], RealtimeGateway.prototype, "handleTypingStarted", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('typing_stopped'),
    (0, common_2.UseGuards)(ws_jwt_guard_1.WsJwtGuard),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], RealtimeGateway.prototype, "handleTypingStopped", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('group_typing_started'),
    (0, common_2.UseGuards)(ws_jwt_guard_1.WsJwtGuard),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], RealtimeGateway.prototype, "handleGroupTypingStarted", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('group_typing_stopped'),
    (0, common_2.UseGuards)(ws_jwt_guard_1.WsJwtGuard),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], RealtimeGateway.prototype, "handleGroupTypingStopped", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('group_message_read'),
    (0, common_2.UseGuards)(ws_jwt_guard_1.WsJwtGuard),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], RealtimeGateway.prototype, "handleGroupMessageRead", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('group_message_delivered'),
    (0, common_2.UseGuards)(ws_jwt_guard_1.WsJwtGuard),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], RealtimeGateway.prototype, "handleGroupMessageDelivered", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('ping'),
    (0, common_2.UseGuards)(ws_jwt_guard_1.WsJwtGuard),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], RealtimeGateway.prototype, "handlePing", null);
exports.RealtimeGateway = RealtimeGateway = RealtimeGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        namespace: '/',
        cors: {
            origin: '*',
            credentials: true,
        },
    }),
    __metadata("design:paramtypes", [jwt_1.JwtService, typeof (_a = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _a : Object, typeof (_b = typeof redis_service_1.RedisService !== "undefined" && redis_service_1.RedisService) === "function" ? _b : Object, typeof (_c = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _c : Object])
], RealtimeGateway);
//# sourceMappingURL=realtime.gateway.js.map