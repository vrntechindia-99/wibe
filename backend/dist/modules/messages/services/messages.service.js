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
exports.MessagesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("@shared/database/prisma.service");
const redis_service_1 = require("@shared/database/redis.service");
const client_1 = require("@prisma/client");
let MessagesService = class MessagesService {
    constructor(prisma, redis) {
        this.prisma = prisma;
        this.redis = redis;
    }
    async sendMessage(conversationId, senderId, dto) {
        const membership = await this.prisma.conversationMember.findUnique({
            where: { conversationId_userId: { conversationId, userId: senderId } },
        });
        if (!membership || membership.leftAt) {
            throw new common_1.NotFoundException('Conversation not found');
        }
        const existingMessage = await this.prisma.message.findFirst({
            where: {
                conversationId,
                senderId,
                clientMessageId: dto.clientMessageId,
            },
        });
        if (existingMessage) {
            return this.formatMessage(existingMessage);
        }
        if (dto.replyToId) {
            const replyTo = await this.prisma.message.findUnique({
                where: { id: dto.replyToId },
            });
            if (!replyTo || replyTo.conversationId !== conversationId || replyTo.deletedAt) {
                throw new common_1.BadRequestException('Invalid reply target');
            }
        }
        const message = await this.prisma.message.create({
            data: {
                conversationId,
                senderId,
                clientMessageId: dto.clientMessageId,
                type: client_1.MessageType.TEXT,
                content: dto.content?.trim() || '',
                status: client_1.MessageStatus.SENT,
                replyToId: dto.replyToId,
            },
            include: {
                sender: { include: { profile: true } },
                replyTo: { include: { sender: { include: { profile: true } } } },
            },
        });
        await this.prisma.conversation.update({
            where: { id: conversationId },
            data: {
                updatedAt: new Date(),
                lastMessageId: message.id,
            },
        });
        await this.prisma.conversationMember.updateMany({
            where: {
                conversationId,
                userId: { not: senderId },
                leftAt: null,
            },
            data: {
                unreadCount: { increment: 1 },
            },
        });
        await this.emitNewMessage(message);
        return this.formatMessage(message);
    }
    async getMessages(conversationId, userId, query) {
        const membership = await this.prisma.conversationMember.findUnique({
            where: { conversationId_userId: { conversationId, userId } },
        });
        if (!membership || membership.leftAt) {
            throw new common_1.NotFoundException('Conversation not found');
        }
        const { page = 1, limit = 50, before, after, sortBy = 'createdAt', sortOrder = 'desc' } = query;
        const where = {
            conversationId,
            deletedAt: null,
        };
        if (before) {
            where.createdAt = { lt: new Date(before) };
        }
        if (after) {
            where.createdAt = { gt: new Date(after) };
        }
        const orderBy = {};
        orderBy[sortBy] = sortOrder;
        const messages = await this.prisma.message.findMany({
            where,
            orderBy,
            skip: (page - 1) * limit,
            take: limit,
            include: {
                sender: { include: { profile: true } },
                replyTo: { include: { sender: { include: { profile: true } } } },
                attachments: true,
                reactions: { include: { user: { include: { profile: true } } } },
                readReceipts: true,
            },
        });
        const total = await this.prisma.message.count({ where });
        return {
            data: messages.map(m => this.formatMessage(m)),
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async getMessage(messageId, userId) {
        const message = await this.prisma.message.findUnique({
            where: { id: messageId },
            include: {
                sender: { include: { profile: true } },
                replyTo: { include: { sender: { include: { profile: true } } } },
                attachments: true,
                reactions: { include: { user: { include: { profile: true } } } },
                readReceipts: true,
            },
        });
        if (!message || message.deletedAt) {
            throw new common_1.NotFoundException('Message not found');
        }
        const membership = await this.prisma.conversationMember.findUnique({
            where: { conversationId_userId: { conversationId: message.conversationId, userId } },
        });
        if (!membership || membership.leftAt) {
            throw new common_1.ForbiddenException('Access denied');
        }
        return this.formatMessage(message);
    }
    async updateMessage(messageId, userId, dto) {
        const message = await this.prisma.message.findUnique({
            where: { id: messageId },
        });
        if (!message || message.deletedAt) {
            throw new common_1.NotFoundException('Message not found');
        }
        if (message.senderId !== userId) {
            throw new common_1.ForbiddenException('Can only edit your own messages');
        }
        const editWindow = 15 * 60 * 1000;
        if (Date.now() - message.createdAt.getTime() > editWindow) {
            throw new common_1.BadRequestException('Edit time limit exceeded');
        }
        const updated = await this.prisma.message.update({
            where: { id: messageId },
            data: {
                content: dto.content.trim(),
                editedAt: new Date(),
            },
            include: {
                sender: { include: { profile: true } },
                replyTo: { include: { sender: { include: { profile: true } } } },
                attachments: true,
            },
        });
        await this.emitMessageUpdated(updated);
        return this.formatMessage(updated);
    }
    async deleteMessage(messageId, userId, forEveryone = false) {
        const message = await this.prisma.message.findUnique({
            where: { id: messageId },
            include: { conversation: { include: { members: true } } },
        });
        if (!message || message.deletedAt) {
            throw new common_1.NotFoundException('Message not found');
        }
        const membership = message.conversation.members.find(m => m.userId === userId && !m.leftAt);
        if (!membership) {
            throw new common_1.ForbiddenException('Not a member of this conversation');
        }
        if (forEveryone) {
            if (message.senderId !== userId && membership.role !== client_1.GroupRole.ADMIN && membership.role !== client_1.GroupRole.OWNER) {
                throw new common_1.ForbiddenException('Cannot delete this message for everyone');
            }
            const deleteWindow = 60 * 60 * 1000;
            if (Date.now() - message.createdAt.getTime() > deleteWindow) {
                throw new common_1.BadRequestException('Delete for everyone time limit exceeded');
            }
            await this.prisma.message.update({
                where: { id: messageId },
                data: { deletedAt: new Date(), deletedForEveryone: true, content: '' },
            });
            await this.emitMessageDeleted(messageId, true);
        }
        else {
            await this.prisma.message.update({
                where: { id: messageId },
                data: { deletedAt: new Date() },
            });
            await this.emitMessageDeleted(messageId, false);
        }
        return { message: 'Message deleted' };
    }
    async searchMessages(userId, query, conversationId, limit = 20) {
        const where = {
            deletedAt: null,
            content: { contains: query, mode: 'insensitive' },
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
                conversation: true,
            },
        });
        return messages.map(m => this.formatMessage(m));
    }
    async emitNewMessage(message) {
        const event = {
            type: 'new_message',
            payload: this.formatMessage(message),
            conversationId: message.conversationId,
        };
        await this.redis.publish(`conversation:${message.conversationId}`, JSON.stringify(event));
    }
    async emitMessageUpdated(message) {
        const event = {
            type: 'message_updated',
            payload: this.formatMessage(message),
            conversationId: message.conversationId,
        };
        await this.redis.publish(`conversation:${message.conversationId}`, JSON.stringify(event));
    }
    async emitMessageDeleted(messageId, forEveryone) {
        const event = {
            type: 'message_deleted',
            payload: { messageId, forEveryone },
        };
        const message = await this.prisma.message.findUnique({
            where: { id: messageId },
            select: { conversationId: true },
        });
        if (message) {
            await this.redis.publish(`conversation:${message.conversationId}`, JSON.stringify(event));
        }
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
            replyTo: message.replyTo ? {
                id: message.replyTo.id,
                content: message.replyTo.content,
                senderId: message.replyTo.senderId,
                sender: message.replyTo.sender ? {
                    id: message.replyTo.sender.id,
                    displayName: message.replyTo.sender.profile?.displayName,
                } : undefined,
            } : undefined,
            attachments: message.attachments?.map((a) => ({
                id: a.id,
                type: a.type,
                url: a.url,
                thumbnailUrl: a.thumbnailUrl,
                fileName: a.fileName,
                mimeType: a.mimeType,
                fileSize: a.fileSize,
                width: a.width,
                height: a.height,
                duration: a.duration,
            })) || [],
            reactions: message.reactions?.map((r) => ({
                id: r.id,
                emoji: r.emoji,
                userId: r.userId,
                user: r.user ? { id: r.user.id, displayName: r.user.profile?.displayName } : undefined,
            })) || [],
            readReceipts: message.readReceipts?.map((r) => ({
                userId: r.userId,
                readAt: r.readAt,
            })) || [],
        };
    }
};
exports.MessagesService = MessagesService;
exports.MessagesService = MessagesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object, typeof (_b = typeof redis_service_1.RedisService !== "undefined" && redis_service_1.RedisService) === "function" ? _b : Object])
], MessagesService);
//# sourceMappingURL=messages.service.js.map