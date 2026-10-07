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
exports.BlockService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("@shared/database/prisma.service");
let BlockService = class BlockService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async blockUser(blockerId, blockedId) {
        if (blockerId === blockedId) {
            throw new common_1.ConflictException('Cannot block yourself');
        }
        const blockedUser = await this.prisma.user.findUnique({
            where: { id: blockedId },
        });
        if (!blockedUser) {
            throw new common_1.NotFoundException('User not found');
        }
        const existing = await this.prisma.blockedUser.findUnique({
            where: { blockerId_blockedId: { blockerId, blockedId } },
        });
        if (existing) {
            throw new common_1.ConflictException('User already blocked');
        }
        await this.prisma.blockedUser.create({
            data: { blockerId, blockedId },
        });
        await this.deleteDirectConversation(blockerId, blockedId);
        return { message: 'User blocked successfully' };
    }
    async unblockUser(blockerId, blockedId) {
        const block = await this.prisma.blockedUser.findUnique({
            where: { blockerId_blockedId: { blockerId, blockedId } },
        });
        if (!block) {
            throw new common_1.NotFoundException('Block not found');
        }
        await this.prisma.blockedUser.delete({
            where: { blockerId_blockedId: { blockerId, blockedId } },
        });
        return { message: 'User unblocked successfully' };
    }
    async getBlockedUsers(userId) {
        return this.prisma.blockedUser.findMany({
            where: { blockerId: userId },
            include: {
                blocked: {
                    include: { profile: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async isBlocked(blockerId, blockedId) {
        const block = await this.prisma.blockedUser.findUnique({
            where: { blockerId_blockedId: { blockerId, blockedId } },
        });
        return !!block;
    }
    async isBlockedEitherWay(userId1, userId2) {
        const block = await this.prisma.blockedUser.findFirst({
            where: {
                OR: [
                    { blockerId: userId1, blockedId: userId2 },
                    { blockerId: userId2, blockedId: userId1 },
                ],
            },
        });
        return !!block;
    }
    async deleteDirectConversation(userId1, userId2) {
        const conversation = await this.prisma.conversation.findFirst({
            where: {
                type: 'DIRECT',
                members: {
                    every: {
                        userId: { in: [userId1, userId2] },
                    },
                },
            },
        });
        if (conversation) {
            await this.prisma.conversationMember.updateMany({
                where: { conversationId: conversation.id, userId: { in: [userId1, userId2] } },
                data: { leftAt: new Date() },
            });
        }
    }
};
exports.BlockService = BlockService;
exports.BlockService = BlockService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object])
], BlockService);
//# sourceMappingURL=block.service.js.map