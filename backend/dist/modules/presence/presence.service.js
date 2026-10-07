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
var PresenceService_1;
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PresenceService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("@shared/database/prisma.service");
const redis_service_1 = require("@shared/database/redis.service");
const privacy_service_1 = require("@modules/users/services/privacy.service");
let PresenceService = PresenceService_1 = class PresenceService {
    constructor(prisma, redis, privacyService) {
        this.prisma = prisma;
        this.redis = redis;
        this.privacyService = privacyService;
        this.logger = new common_1.Logger(PresenceService_1.name);
    }
    async getPresence(userId, requesterId) {
        const canView = await this.privacyService.canViewLastSeen(userId, requesterId);
        if (!canView) {
            return { online: false, lastSeen: null };
        }
        const isOnline = await this.redis.isUserOnline(userId);
        if (!isOnline) {
            const profile = await this.prisma.userProfile.findUnique({
                where: { userId },
                select: { updatedAt: true },
            });
            return {
                online: false,
                lastSeen: profile?.updatedAt || null,
            };
        }
        return { online: true, lastSeen: null };
    }
    async getOnlineUsers(userIds, requesterId) {
        const results = {};
        for (const userId of userIds) {
            results[userId] = await this.getPresence(userId, requesterId);
        }
        return results;
    }
    async getConversationPresence(conversationId, userId) {
        const members = await this.prisma.conversationMember.findMany({
            where: { conversationId, leftAt: null },
            select: { userId: true },
        });
        const userIds = members.map(m => m.userId).filter(id => id !== userId);
        return this.getOnlineUsers(userIds, userId);
    }
    async updateLastActive(userId) {
        await this.prisma.userProfile.update({
            where: { userId },
            data: { updatedAt: new Date() },
        });
    }
    async isOnline(userId) {
        return this.redis.isUserOnline(userId);
    }
};
exports.PresenceService = PresenceService;
exports.PresenceService = PresenceService = PresenceService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object, typeof (_b = typeof redis_service_1.RedisService !== "undefined" && redis_service_1.RedisService) === "function" ? _b : Object, typeof (_c = typeof privacy_service_1.PrivacyService !== "undefined" && privacy_service_1.PrivacyService) === "function" ? _c : Object])
], PresenceService);
//# sourceMappingURL=presence.service.js.map