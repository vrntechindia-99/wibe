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
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConversationsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("@shared/database/prisma.service");
const redis_service_1 = require("@shared/database/redis.service");
const client_1 = require("@prisma/client");
const conversation_query_dto_1 = require("../dto/conversation-query.dto");
let ConversationsService = class ConversationsService {
    constructor(prisma, redis) {
        this.prisma = prisma;
        this.redis = redis;
    }
    async createDirectConversation(userId, dto) {
        if (!dto.userId) {
            throw new common_1.BadRequestException('userId is required for direct conversation');
        }
        if (dto.userId === userId) {
            throw new common_1.BadRequestException('Cannot create conversation with yourself');
        }
        const targetUser = await this.prisma.user.findUnique({
            where: { id: dto.userId },
        });
        if (!targetUser || targetUser.deletedAt || !targetUser.isVerified) {
            throw new common_1.NotFoundException('User not found');
        }
        const isBlocked = await this.prisma.blockedUser.findFirst({
            where: {
                OR: [
                    { blockerId: userId, blockedId: dto.userId },
                    { blockerId: dto.userId, blockedId: userId },
                ],
            },
        });
        if (isBlocked) {
            throw new common_1.ForbiddenException('Cannot create conversation');
        }
        const existingConversation = await this.prisma.conversation.findFirst({
            where: {
                type: client_1.ConversationType.DIRECT,
                members: {
                    every: {
                        userId: { in: [userId, dto.userId] },
                    },
                },
            },
            include: { members: true },
        });
        if (existingConversation) {
            const userMember = existingConversation.members.find(m => m.userId === userId);
            if (userMember?.leftAt) {
                await this.prisma.conversationMember.update({
                    where: { id: userMember.id },
                    data: { leftAt: null, joinedAt: new Date() },
                });
            }
            return this.getConversationForUser(existingConversation.id, userId);
        }
        const conversation = await this.prisma.conversation.create({
            data: {
                type: client_1.ConversationType.DIRECT,
                createdBy: userId,
                members: {
                    create: [
                        { userId, role: client_1.GroupRole.MEMBER },
                        { userId: dto.userId, role: client_1.GroupRole.MEMBER },
                    ],
                },
            },
            include: { members: true },
        });
        return this.getConversationForUser(conversation.id, userId);
    }
    async createGroupConversation(userId, dto) {
        if (!dto.name?.trim()) {
            throw new common_1.BadRequestException('Group name is required');
        }
        const memberIds = dto.userId ? [dto.userId] : [];
        const uniqueMemberIds = [...new Set([userId, ...memberIds])];
        if (uniqueMemberIds.length < 2) {
            throw new common_1.BadRequestException('Group must have at least 2 members');
        }
        if (uniqueMemberIds.length > 512) {
            throw new common_1.BadRequestException('Group cannot have more than 512 members');
        }
        const users = await this.prisma.user.findMany({
            where: { id: { in: uniqueMemberIds } },
        });
        if (users.length !== uniqueMemberIds.length) {
            throw new common_1.NotFoundException('One or more users not found');
        }
        for (const memberId of uniqueMemberIds.filter(id => id !== userId)) {
            const isBlocked = await this.prisma.blockedUser.findFirst({
                where: {
                    OR: [
                        { blockerId: userId, blockedId: memberId },
                        { blockerId: memberId, blockedId: userId },
                    ],
                },
            });
            if (isBlocked) {
                throw new common_1.ForbiddenException(`Cannot add blocked user: ${memberId}`);
            }
        }
        const conversation = await this.prisma.conversation.create({
            data: {
                type: client_1.ConversationType.GROUP,
                name: dto.name.trim(),
                description: dto.description?.trim(),
                createdBy: userId,
                members: {
                    create: uniqueMemberIds.map(id => ({
                        userId: id,
                        role: id === userId ? client_1.GroupRole.OWNER : client_1.GroupRole.MEMBER,
                        invitedBy: id === userId ? null : userId,
                    })),
                },
                group: {
                    create: {
                        name: dto.name.trim(),
                        description: dto.description?.trim(),
                        createdBy: userId,
                    },
                },
            },
            include: { members: true, group: true },
        });
        return this.getConversationForUser(conversation.id, userId);
    }
    async getConversations(userId, query) {
        const { page = 1, limit = 20, sortBy = conversation_query_dto_1.ConversationSortBy.UPDATED_AT, sortOrder = conversation_query_dto_1.SortOrder.DESC, includeArchived = false, search } = query;
        const where = {
            members: {
                some: {
                    userId,
                    leftAt: null,
                },
            },
        };
        if (!includeArchived) {
            where.members = {
                some: {
                    userId,
                    leftAt: null,
                    isArchived: false,
                },
            };
        }
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { messages: { some: { content: { contains: search, mode: 'insensitive' } } } },
            ];
        }
        const orderBy = {};
        orderBy[sortBy] = sortOrder;
        const [conversations, total] = await Promise.all([
            this.prisma.conversation.findMany({
                where,
                orderBy,
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    members: {
                        where: { userId: { not: userId } },
                        include: { user: { include: { profile: true } } },
                        take: 10,
                    },
                    group: true,
                    _count: { select: { members: true, messages: true } },
                },
            }),
            this.prisma.conversation.count({ where }),
        ]);
        const enriched = await Promise.all(conversations.map(c => this.enrichConversation(c, userId)));
        return {
            data: enriched,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async getConversation(conversationId, userId) {
        const membership = await this.prisma.conversationMember.findUnique({
            where: { conversationId_userId: { conversationId, userId } },
        });
        if (!membership || membership.leftAt) {
            throw new common_1.NotFoundException('Conversation not found');
        }
        return this.getConversationForUser(conversationId, userId);
    }
    async getConversationForUser(conversationId, userId) {
        const conversation = await this.prisma.conversation.findUnique({
            where: { id: conversationId },
            include: {
                members: {
                    include: { user: { include: { profile: true } } },
                },
                group: true,
                _count: { select: { messages: true } },
            },
        });
        if (!conversation) {
            throw new common_1.NotFoundException('Conversation not found');
        }
        return this.enrichConversation(conversation, userId);
    }
    async enrichConversation(conversation, userId) {
        const membership = conversation.members.find((m) => m.userId === userId);
        const otherMembers = conversation.members.filter((m) => m.userId !== userId);
        let displayName = conversation.name;
        let displayAvatar = conversation.avatarUrl;
        if (conversation.type === client_1.ConversationType.DIRECT && otherMembers.length > 0) {
            const other = otherMembers[0];
            displayName = other.user.profile?.displayName || 'Unknown';
            displayAvatar = other.user.profile?.avatarUrl;
        }
        const lastMessage = await this.prisma.message.findFirst({
            where: { conversationId: conversation.id, deletedAt: null },
            orderBy: { createdAt: 'desc' },
            include: { sender: { include: { profile: true } } },
        });
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
            lastMessage: lastMessage ? this.formatMessage(lastMessage) : null,
            members: otherMembers.map((m) => ({
                id: m.id,
                userId: m.userId,
                displayName: m.user.profile?.displayName || 'Unknown',
                avatarUrl: m.user.profile?.avatarUrl,
                role: m.role,
                isOnline: false,
                lastSeen: m.user.profile?.updatedAt,
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
            isDeleted: message.deletedAt !== null,
            createdAt: message.createdAt,
            updatedAt: message.updatedAt,
            sender: message.sender ? {
                id: message.sender.id,
                displayName: message.sender.profile?.displayName,
                avatarUrl: message.sender.profile?.avatarUrl,
            } : undefined,
        };
    }
    async updateConversation(conversationId, userId, dto) {
        const membership = await this.getMembershipOrThrow(conversationId, userId, [client_1.GroupRole.ADMIN, client_1.GroupRole.OWNER]);
        const conversation = await this.prisma.conversation.update({
            where: { id: conversationId },
            data: {
                name: dto.name,
                description: dto.description,
                avatarUrl: dto.avatarUrl,
            },
        });
        return this.getConversationForUser(conversationId, userId);
    }
    async pinConversation(conversationId, userId) {
        await this.getMembershipOrThrow(conversationId, userId);
        await this.prisma.conversationMember.update({
            where: { conversationId_userId: { conversationId, userId } },
            data: { isPinned: true },
        });
        return { message: 'Conversation pinned' };
    }
    async unpinConversation(conversationId, userId) {
        await this.getMembershipOrThrow(conversationId, userId);
        await this.prisma.conversationMember.update({
            where: { conversationId_userId: { conversationId, userId } },
            data: { isPinned: false },
        });
        return { message: 'Conversation unpinned' };
    }
    async muteConversation(conversationId, userId, dto) {
        await this.getMembershipOrThrow(conversationId, userId);
        const muteUntil = dto.duration ? new Date(Date.now() + dto.duration * 1000) : null;
        await this.prisma.conversationMember.update({
            where: { conversationId_userId: { conversationId, userId } },
            data: { isMuted: true, muteUntil },
        });
        return { message: 'Conversation muted' };
    }
    async unmuteConversation(conversationId, userId) {
        await this.getMembershipOrThrow(conversationId, userId);
        await this.prisma.conversationMember.update({
            where: { conversationId_userId: { conversationId, userId } },
            data: { isMuted: false, muteUntil: null },
        });
        return { message: 'Conversation unmuted' };
    }
    async archiveConversation(conversationId, userId) {
        await this.getMembershipOrThrow(conversationId, userId);
        await this.prisma.conversationMember.update({
            where: { conversationId_userId: { conversationId, userId } },
            data: { isArchived: true },
        });
        return { message: 'Conversation archived' };
    }
    async unarchiveConversation(conversationId, userId) {
        await this.getMembershipOrThrow(conversationId, userId);
        await this.prisma.conversationMember.update({
            where: { conversationId_userId: { conversationId, userId } },
            data: { isArchived: false },
        });
        return { message: 'Conversation unarchived' };
    }
    async markUnread(conversationId, userId) {
        const membership = await this.getMembershipOrThrow(conversationId, userId);
        if (!membership.lastReadMessageId) {
            return { message: 'Already unread' };
        }
        await this.prisma.conversationMember.update({
            where: { conversationId_userId: { conversationId, userId } },
            data: { lastReadMessageId: null, unreadCount: 0 },
        });
        return { message: 'Conversation marked unread' };
    }
    async deleteConversation(conversationId, userId, forEveryone = false) {
        const membership = await this.getMembershipOrThrow(conversationId, userId);
        if (forEveryone) {
            if (membership.role !== client_1.GroupRole.OWNER && membership.role !== client_1.GroupRole.ADMIN) {
                throw new common_1.ForbiddenException('Only admins can delete conversation for everyone');
            }
            await this.prisma.conversation.update({
                where: { id: conversationId },
                data: { deletedAt: new Date() },
            });
            await this.prisma.conversationMember.updateMany({
                where: { conversationId },
                data: { leftAt: new Date() },
            });
        }
        else {
            await this.prisma.conversationMember.update({
                where: { conversationId_userId: { conversationId, userId } },
                data: { leftAt: new Date() },
            });
        }
        return { message: 'Conversation deleted' };
    }
    async markAsRead(conversationId, userId, messageId) {
        const membership = await this.getMembershipOrThrow(conversationId, userId);
        if (!messageId) {
            const lastMessage = await this.prisma.message.findFirst({
                where: { conversationId, deletedAt: null },
                orderBy: { createdAt: 'desc' },
                select: { id: true },
            });
            if (!lastMessage)
                return { message: 'No messages to mark as read' };
            messageId = lastMessage.id;
        }
        await this.prisma.conversationMember.update({
            where: { conversationId_userId: { conversationId, userId } },
            data: { lastReadMessageId: messageId, unreadCount: 0 },
        });
        await this.prisma.messageReadReceipt.upsert({
            where: { messageId_userId: { messageId, userId } },
            create: { messageId, userId },
            update: { readAt: new Date() },
        });
        await this.redis.publish(`conversation:${conversationId}:read`, JSON.stringify({
            messageId,
            userId,
            conversationId,
        }));
        return { message: 'Messages marked as read' };
    }
    async markAsDelivered(conversationId, userId, messageId) {
        await this.getMembershipOrThrow(conversationId, userId);
        await this.prisma.message.update({
            where: { id: messageId },
            data: { status: client_1.MessageStatus.DELIVERED },
        });
        await this.redis.publish(`conversation:${conversationId}:delivered`, JSON.stringify({
            messageId,
            userId,
            conversationId,
        }));
        return { message: 'Message marked as delivered' };
    }
    async getMembershipOrThrow(conversationId, userId, requiredRoles) {
        const membership = await this.prisma.conversationMember.findUnique({
            where: { conversationId_userId: { conversationId, userId } },
        });
        if (!membership || membership.leftAt) {
            throw new common_1.NotFoundException('Conversation not found');
        }
        if (requiredRoles && !requiredRoles.includes(membership.role)) {
            throw new common_1.ForbiddenException('Insufficient permissions');
        }
        return membership;
    }
};
exports.ConversationsService = ConversationsService;
exports.ConversationsService = ConversationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object, typeof (_b = typeof redis_service_1.RedisService !== "undefined" && redis_service_1.RedisService) === "function" ? _b : Object])
], ConversationsService);
//# sourceMappingURL=conversations.service.js.map