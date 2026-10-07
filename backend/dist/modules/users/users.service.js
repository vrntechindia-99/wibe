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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("@shared/database/prisma.service");
let UsersService = class UsersService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findById(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { profile: true },
        });
        if (!user || user.deletedAt) {
            throw new common_1.NotFoundException('User not found');
        }
        const { ...safeUser } = user;
        return safeUser;
    }
    async findByPhoneNumber(phoneNumber) {
        return this.prisma.user.findUnique({
            where: { phoneNumber },
        });
    }
    async searchUsers(query, currentUserId, limit = 20) {
        return this.prisma.user.findMany({
            where: {
                AND: [
                    { id: { not: currentUserId } },
                    { deletedAt: null },
                    { isVerified: true },
                    {
                        OR: [
                            { phoneNumber: { contains: query, mode: 'insensitive' } },
                            { profile: { displayName: { contains: query, mode: 'insensitive' } } },
                        ],
                    },
                ],
            },
            include: { profile: true },
            take: limit,
            orderBy: { createdAt: 'desc' },
        });
    }
    async getUserProfile(userId, requesterId) {
        const user = await this.findById(userId);
        const profile = user.profile;
        if (!profile) {
            return { user, profile: null, canView: false };
        }
        const canView = await this.canViewProfile(profile, userId, requesterId);
        return {
            user: { id: user.id, phoneNumber: user.phoneNumber, isVerified: user.isVerified },
            profile: canView ? profile : this.filterProfileByPrivacy(profile, userId, requesterId),
            canView,
        };
    }
    async canViewProfile(profile, targetUserId, requesterId) {
        if (targetUserId === requesterId)
            return true;
        const blocked = await this.prisma.blockedUser.findFirst({
            where: {
                OR: [
                    { blockerId: requesterId, blockedId: targetUserId },
                    { blockerId: targetUserId, blockedId: requesterId },
                ],
            },
        });
        if (blocked)
            return false;
        return true;
    }
    filterProfileByPrivacy(profile, targetUserId, requesterId) {
        return {
            displayName: profile.displayName,
            avatarUrl: profile.avatarUrl,
        };
    }
    async updateLastSeen(userId) {
        await this.prisma.userProfile.update({
            where: { userId },
            data: { updatedAt: new Date() },
        });
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object])
], UsersService);
//# sourceMappingURL=users.service.js.map