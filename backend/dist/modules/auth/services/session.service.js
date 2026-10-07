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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("@shared/database/prisma.service");
const token_service_1 = require("./token.service");
let SessionService = class SessionService {
    constructor(prisma, tokenService) {
        this.prisma = prisma;
        this.tokenService = tokenService;
    }
    async createSession(userId, deviceId, refreshToken) {
        const payload = await this.tokenService.verifyRefreshToken(refreshToken);
        if (!payload) {
            throw new Error('Invalid refresh token');
        }
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);
        return this.prisma.session.create({
            data: {
                userId,
                deviceId,
                refreshToken: await this.hashToken(refreshToken),
                sessionId: payload.sessionId,
                expiresAt,
            },
        });
    }
    async findSession(sessionId) {
        return this.prisma.session.findUnique({
            where: { sessionId },
            include: { user: true, device: true },
        });
    }
    async updateSession(sessionId, newRefreshToken) {
        const payload = await this.tokenService.verifyRefreshToken(newRefreshToken);
        if (!payload) {
            throw new Error('Invalid refresh token');
        }
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);
        return this.prisma.session.update({
            where: { sessionId },
            data: {
                refreshToken: await this.hashToken(newRefreshToken),
                expiresAt,
            },
        });
    }
    async revokeSession(userId, deviceId) {
        await this.prisma.session.updateMany({
            where: { userId, deviceId, revokedAt: null },
            data: { revokedAt: new Date() },
        });
    }
    async revokeAllSessions(userId) {
        await this.prisma.session.updateMany({
            where: { userId, revokedAt: null },
            data: { revokedAt: new Date() },
        });
    }
    async revokeSessionById(sessionId) {
        await this.prisma.session.update({
            where: { sessionId },
            data: { revokedAt: new Date() },
        });
    }
    async getUserSessions(userId) {
        return this.prisma.session.findMany({
            where: { userId, revokedAt: null },
            include: { device: true },
            orderBy: { createdAt: 'desc' },
        });
    }
    async cleanupExpiredSessions() {
        const result = await this.prisma.session.deleteMany({
            where: { expiresAt: { lt: new Date() } },
        });
        return result.count;
    }
    async hashToken(token) {
        return token;
    }
};
exports.SessionService = SessionService;
exports.SessionService = SessionService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object, token_service_1.TokenService])
], SessionService);
//# sourceMappingURL=session.service.js.map