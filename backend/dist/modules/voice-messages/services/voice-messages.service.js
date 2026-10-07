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
var VoiceMessagesService_1;
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoiceMessagesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("@shared/database/prisma.service");
const media_service_1 = require("@modules/media/services/media.service");
const redis_service_1 = require("@shared/database/redis.service");
let VoiceMessagesService = VoiceMessagesService_1 = class VoiceMessagesService {
    constructor(prisma, mediaService, redis) {
        this.prisma = prisma;
        this.mediaService = mediaService;
        this.redis = redis;
        this.logger = new common_1.Logger(VoiceMessagesService_1.name);
    }
    async getVoiceMessage(messageId, userId) {
        const message = await this.prisma.message.findUnique({
            where: { id: messageId },
            include: {
                attachments: true,
                conversation: {
                    include: { members: true },
                },
            },
        });
        if (!message || message.deletedAt) {
            throw new common_1.NotFoundException('Voice message not found');
        }
        if (message.type !== 'AUDIO') {
            throw new BadRequestException('Message is not a voice message');
        }
        const membership = message.conversation.members.find((m) => m.userId === userId && !m.leftAt);
        if (!membership) {
            throw new common_1.ForbiddenException('Not a member of this conversation');
        }
        const attachment = message.attachments[0];
        if (!attachment) {
            throw new common_1.NotFoundException('Voice attachment not found');
        }
        const downloadUrl = await this.mediaService.getPresignedDownloadUrl(attachment.id, userId);
        return {
            id: message.id,
            clientMessageId: message.clientMessageId,
            conversationId: message.conversationId,
            senderId: message.senderId,
            duration: attachment.duration,
            waveform: attachment.waveform,
            downloadUrl,
            status: message.status,
            createdAt: message.createdAt,
        };
    }
    async getVoiceMessagesInConversation(conversationId, userId) {
        const membership = await this.prisma.conversationMember.findUnique({
            where: { conversationId_userId: { conversationId, userId } },
        });
        if (!membership || membership.leftAt) {
            throw new common_1.ForbiddenException('Not a member of this conversation');
        }
        const messages = await this.prisma.message.findMany({
            where: {
                conversationId,
                type: 'AUDIO',
                deletedAt: null,
            },
            orderBy: { createdAt: 'desc' },
            include: { attachments: true },
        });
        return messages.map((m) => ({
            id: m.id,
            clientMessageId: m.clientMessageId,
            senderId: m.senderId,
            duration: m.attachments[0]?.duration,
            waveform: m.attachments[0]?.waveform,
            status: m.status,
            createdAt: m.createdAt,
        }));
    }
    async deleteVoiceMessage(messageId, userId) {
        const message = await this.prisma.message.findUnique({
            where: { id: messageId },
            include: { attachments: true },
        });
        if (!message || message.deletedAt) {
            throw new common_1.NotFoundException('Voice message not found');
        }
        if (message.senderId !== userId) {
            throw new common_1.ForbiddenException('Cannot delete another user\'s voice message');
        }
        if (message.attachments[0]) {
            await this.mediaService.deleteMedia(message.attachments[0].id, userId);
        }
        await this.prisma.message.update({
            where: { id: messageId },
            data: { deletedAt: new Date(), deletedForEveryone: true },
        });
        return { message: 'Voice message deleted' };
    }
    async saveWaveformData(attachmentId, waveform) {
        await this.prisma.messageAttachment.update({
            where: { id: attachmentId },
            data: { waveform },
        });
    }
};
exports.VoiceMessagesService = VoiceMessagesService;
exports.VoiceMessagesService = VoiceMessagesService = VoiceMessagesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object, typeof (_b = typeof media_service_1.MediaService !== "undefined" && media_service_1.MediaService) === "function" ? _b : Object, typeof (_c = typeof redis_service_1.RedisService !== "undefined" && redis_service_1.RedisService) === "function" ? _c : Object])
], VoiceMessagesService);
//# sourceMappingURL=voice-messages.service.js.map