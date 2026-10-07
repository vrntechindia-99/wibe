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
exports.SearchService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("@shared/database/prisma.service");
let SearchService = class SearchService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async searchUsers(query, currentUserId, limit = 20) {
        if (!query || query.trim().length < 2) {
            return [];
        }
        const searchTerm = query.trim();
        const users = await this.prisma.user.findMany({
            where: {
                AND: [
                    { id: { not: currentUserId } },
                    { deletedAt: null },
                    { isVerified: true },
                    {
                        OR: [
                            { phoneNumber: { contains: searchTerm, mode: 'insensitive' } },
                            { profile: { displayName: { contains: searchTerm, mode: 'insensitive' } } },
                        ],
                    },
                ],
            },
            include: {
                profile: {
                    select: {
                        displayName: true,
                        avatarUrl: true,
                        about: true,
                        privacyProfilePhoto: true,
                        privacyAbout: true,
                    },
                },
            },
            take: limit,
            orderBy: { createdAt: 'desc' },
        });
        return users.map(u => ({
            id: u.id,
            phoneNumber: u.phoneNumber,
            displayName: u.profile?.displayName,
            avatarUrl: u.profile?.avatarUrl,
            about: u.profile?.about,
            isVerified: u.isVerified,
        }));
    }
    async searchConversations(query, userId, limit = 20) {
        if (!query || query.trim().length < 2) {
            return [];
        }
        const searchTerm = query.trim();
        const conversations = await this.prisma.conversation.findMany({
            where: {
                deletedAt: null,
                members: {
                    some: {
                        userId,
                        leftAt: null,
                    },
                },
                OR: [
                    { name: { contains: searchTerm, mode: 'insensitive' } },
                    {
                        messages: {
                            some: {
                                content: { contains: searchTerm, mode: 'insensitive' },
                                deletedAt: null,
                            },
                        },
                    },
                ],
            },
            include: {
                members: {
                    where: { userId: { not: userId }, leftAt: null },
                    include: { user: { include: { profile: true } } },
                    take: 10,
                },
                group: true,
                _count: { select: { messages: true } },
            },
            take: limit,
            orderBy: { updatedAt: 'desc' },
        });
        return conversations.map(c => this.enrichConversation(c, userId));
    }
    async searchMessages(query, userId, conversationId, limit = 20) {
        if (!query || query.trim().length < 2) {
            return [];
        }
        const searchTerm = query.trim();
        const where = {
            deletedAt: null,
            content: { contains: searchTerm, mode: 'insensitive' },
        };
        if (conversationId) {
            where.conversationId = conversationId;
        }
        else {
            where.conversation = {
                members: { some: { userId, leftAt: null } },
            };
        }
        const messages = await this.prisma.message.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: limit,
            include: {
                sender: { include: { profile: true } },
                conversation: {
                    include: {
                        members: {
                            where: { userId: { not: userId }, leftAt: null },
                            include: { user: { include: { profile: true } } },
                            take: 5,
                        },
                    },
                },
            },
        });
        return messages.map(m => this.formatMessage(m));
    }
    enrichConversation(conversation, userId) {
        const membership = conversation.members.find((m) => m.userId === userId);
        const otherMembers = conversation.members.filter((m) => m.userId !== userId);
        let displayName = conversation.name;
        let displayAvatar = conversation.avatarUrl;
        if (conversation.type === 'DIRECT' && otherMembers.length > 0) {
            const other = otherMembers[0];
            displayName = other.user.profile?.displayName || 'Unknown';
            displayAvatar = other.user.profile?.avatarUrl;
        }
        return {
            id: conversation.id,
            type: conversation.type,
            name: displayName,
            avatarUrl: displayAvatar,
            isPinned: membership?.isPinned || false,
            isArchived: membership?.isArchived || false,
            isMuted: membership?.isMuted || false,
            muteUntil: membership?.muteUntil,
            unreadCount: membership?.unreadCount || 0,
            members: otherMembers.map((m) => ({
                id: m.id,
                userId: m.userId,
                displayName: m.user.profile?.displayName || 'Unknown',
                avatarUrl: m.user.profile?.avatarUrl,
                role: m.role,
            })),
            group: conversation.group,
            createdAt: conversation.createdAt,
            updatedAt: conversation.updatedAt,
        };
    }
    formatMessage(message) {
        return {
            id: message.id,
            clientMessageId: message.clientMessageId,
            conversationId: message.conversationId,
            senderId: message.senderId,
            type: message.type,
            content: message.content,
            status: message.status,
            replyToId: message.replyToId,
            isEdited: message.editedAt !== null,
            editedAt: message.editedAt,
            isDeleted: message.deletedAt !== null,
            deletedForEveryone: message.deletedForEveryone,
            createdAt: message.createdAt,
            updatedAt: message.updatedAt,
            sender: message.sender ? {
                id: message.sender.id,
                displayName: message.sender.profile?.displayName,
                avatarUrl: message.sender.profile?.avatarUrl,
            } : undefined,
            conversation: message.conversation ? {
                id: message.conversation.id,
                type: message.conversation.type,
                name: message.conversation.name,
            } : undefined,
        };
    }
};
exports.SearchService = SearchService;
exports.SearchService = SearchService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object])
], SearchService);
//# sourceMappingURL=search.service.js.map