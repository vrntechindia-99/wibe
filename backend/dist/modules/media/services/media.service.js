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
var MediaService_1;
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MediaService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("@shared/database/prisma.service");
const redis_service_1 = require("@shared/database/redis.service");
const minio_service_1 = require("./minio.service");
const media_validation_service_1 = require("./media-validation.service");
const thumbnail_service_1 = require("./thumbnail.service");
const uuid_1 = require("uuid");
let MediaService = MediaService_1 = class MediaService {
    constructor(prisma, redis, minio, validation, thumbnail) {
        this.prisma = prisma;
        this.redis = redis;
        this.minio = minio;
        this.validation = validation;
        this.thumbnail = thumbnail;
        this.logger = new common_1.Logger(MediaService_1.name);
        this.sessionTtl = 3600;
    }
    async createUploadSession(userId, dto) {
        this.validation.validateMimeType(dto.mediaType, dto.mimeType);
        this.validation.validateSize(dto.mediaType, dto.sizeBytes);
        this.validation.validateFilename(dto.originalFilename);
        this.validation.validateExtension(dto.mediaType, dto.originalFilename, dto.mimeType);
        const storageKey = this.minio.generateStorageKey(userId, dto.mediaType, dto.originalFilename);
        const thumbnailKey = dto.mediaType === 'IMAGE' || dto.mediaType === 'VIDEO'
            ? this.minio.generateThumbnailKey(storageKey)
            : undefined;
        const sessionId = (0, uuid_1.v4)();
        const session = {
            id: sessionId,
            userId,
            mediaType: dto.mediaType,
            mimeType: dto.mimeType,
            originalFilename: dto.originalFilename,
            sizeBytes: dto.sizeBytes,
            storageKey,
            thumbnailKey,
            caption: dto.caption,
            conversationId: dto.conversationId,
            clientMessageId: dto.clientMessageId,
            status: 'CREATED',
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + this.sessionTtl * 1000),
        };
        await this.redis.set(`upload_session:${sessionId}`, JSON.stringify(session), this.sessionTtl);
        const uploadUrl = await this.minio.getPresignedUploadUrl(storageKey, dto.mimeType);
        return {
            uploadSessionId: sessionId,
            uploadUrl,
            storageKey,
            thumbnailKey,
        };
    }
    async createMultipartUploadSession(userId, dto) {
        const sessionResult = await this.createUploadSession(userId, dto);
        const uploadId = await this.minio.createMultipartUpload(sessionResult.storageKey, dto.mimeType);
        const sessionData = await this.redis.get(`upload_session:${sessionResult.uploadSessionId}`);
        if (sessionData) {
            const session = JSON.parse(sessionData);
            session.uploadId = uploadId;
            session.status = 'UPLOADING';
            await this.redis.set(`upload_session:${sessionResult.uploadSessionId}`, JSON.stringify(session), this.sessionTtl);
        }
        return {
            ...sessionResult,
            uploadId,
        };
    }
    async getPresignedPartUrl(uploadSessionId, partNumber) {
        const sessionData = await this.redis.get(`upload_session:${uploadSessionId}`);
        if (!sessionData) {
            throw new common_1.NotFoundException('Upload session not found or expired');
        }
        const session = JSON.parse(sessionData);
        if (!session.uploadId) {
            throw new common_1.BadRequestException('Not a multipart upload session');
        }
        return this.minio.getPresignedUploadUrlForMultipart(session.storageKey, session.mimeType, partNumber, session.uploadId);
    }
    async completeMultipartUpload(userId, dto) {
        const sessionData = await this.redis.get(`upload_session:${dto.uploadSessionId}`);
        if (!sessionData) {
            throw new common_1.NotFoundException('Upload session not found or expired');
        }
        const session = JSON.parse(sessionData);
        if (session.userId !== userId) {
            throw new common_1.ForbiddenException('Not authorized to complete this upload');
        }
        if (!session.uploadId) {
            throw new common_1.BadRequestException('Not a multipart upload session');
        }
        if (!session.parts || session.parts.length === 0) {
            throw new common_1.BadRequestException('No parts uploaded');
        }
        await this.minio.completeMultipartUpload(session.storageKey, session.uploadId, session.parts);
        const actualSize = await this.minio.getObjectSize(session.storageKey);
        if (actualSize !== session.sizeBytes) {
            this.logger.warn(`Size mismatch: expected ${session.sizeBytes}, got ${actualSize}`);
        }
        let thumbnailGenerated = false;
        if (session.thumbnailKey && (session.mediaType === 'IMAGE' || session.mediaType === 'VIDEO')) {
            try {
                thumbnailGenerated = true;
            }
            catch (error) {
                this.logger.warn('Thumbnail generation failed', error);
            }
        }
        const message = await this.prisma.message.create({
            data: {
                conversationId: session.conversationId,
                senderId: userId,
                clientMessageId: session.clientMessageId || (0, uuid_1.v4)(),
                type: session.mediaType,
                content: session.caption,
                status: 'SENT',
                attachments: {
                    create: {
                        type: session.mediaType,
                        url: this.minio.getPublicUrl(session.storageKey),
                        thumbnailUrl: session.thumbnailKey ? this.minio.getPublicUrl(session.thumbnailKey) : null,
                        fileName: session.originalFilename,
                        mimeType: session.mimeType,
                        fileSize: session.sizeBytes,
                        width: null,
                        height: null,
                        duration: session.mediaType === 'VIDEO' || session.mediaType === 'AUDIO' ? null : undefined,
                    },
                },
            },
            include: { attachments: true },
        });
        await this.prisma.conversation.update({
            where: { id: session.conversationId },
            data: { updatedAt: new Date(), lastMessageId: message.id },
        });
        await this.prisma.conversationMember.updateMany({
            where: {
                conversationId: session.conversationId,
                userId: { not: userId },
                leftAt: null,
            },
            data: { unreadCount: { increment: 1 } },
        });
        await this.redis.del(`upload_session:${dto.uploadSessionId}`);
        await this.emitNewMessage(message);
        return {
            messageId: message.id,
            attachment: message.attachments[0],
        };
    }
    async completeSinglePartUpload(userId, dto) {
        const sessionData = await this.redis.get(`upload_session:${dto.uploadSessionId}`);
        if (!sessionData) {
            throw new common_1.NotFoundException('Upload session not found or expired');
        }
        const session = JSON.parse(sessionData);
        if (session.userId !== userId) {
            throw new common_1.ForbiddenException('Not authorized to complete this upload');
        }
        const exists = await this.minio.objectExists(session.storageKey);
        if (!exists) {
            throw new common_1.BadRequestException('Object not found in storage');
        }
        const actualSize = await this.minio.getObjectSize(session.storageKey);
        if (actualSize !== session.sizeBytes) {
            this.logger.warn(`Size mismatch: expected ${session.sizeBytes}, got ${actualSize}`);
        }
        if (session.thumbnailKey && (session.mediaType === 'IMAGE' || session.mediaType === 'VIDEO')) {
            try {
            }
            catch (error) {
                this.logger.warn('Thumbnail generation failed', error);
            }
        }
        const message = await this.prisma.message.create({
            data: {
                conversationId: session.conversationId,
                senderId: userId,
                clientMessageId: session.clientMessageId || (0, uuid_1.v4)(),
                type: session.mediaType,
                content: session.caption,
                status: 'SENT',
                attachments: {
                    create: {
                        type: session.mediaType,
                        url: this.minio.getPublicUrl(session.storageKey),
                        thumbnailUrl: session.thumbnailKey ? this.minio.getPublicUrl(session.thumbnailKey) : null,
                        fileName: session.originalFilename,
                        mimeType: session.mimeType,
                        fileSize: session.sizeBytes,
                    },
                },
            },
            include: { attachments: true },
        });
        await this.prisma.conversation.update({
            where: { id: session.conversationId },
            data: { updatedAt: new Date(), lastMessageId: message.id },
        });
        await this.prisma.conversationMember.updateMany({
            where: {
                conversationId: session.conversationId,
                userId: { not: userId },
                leftAt: null,
            },
            data: { unreadCount: { increment: 1 } },
        });
        await this.redis.del(`upload_session:${dto.uploadSessionId}`);
        await this.emitNewMessage(message);
        return {
            messageId: message.id,
            attachment: message.attachments[0],
        };
    }
    async getMediaAttachment(attachmentId, userId) {
        const attachment = await this.prisma.messageAttachment.findUnique({
            where: { id: attachmentId },
            include: {
                message: {
                    include: {
                        conversation: {
                            include: { members: true },
                        },
                    },
                },
            },
        });
        if (!attachment) {
            throw new common_1.NotFoundException('Attachment not found');
        }
        const membership = attachment.message.conversation.members.find((m) => m.userId === userId && !m.leftAt);
        if (!membership) {
            throw new common_1.ForbiddenException('Not authorized to access this media');
        }
        return attachment;
    }
    async getPresignedDownloadUrl(attachmentId, userId) {
        const attachment = await this.getMediaAttachment(attachmentId, userId);
        const publicUrl = this.minio.getPublicUrl('');
        const storageKey = attachment.url.replace(`${publicUrl}/`, '');
        const disposition = `inline; filename="${encodeURIComponent(attachment.fileName || 'file')}"`;
        return this.minio.getPresignedDownloadUrl(storageKey, 3600, disposition);
    }
    async deleteMedia(attachmentId, userId) {
        const attachment = await this.prisma.messageAttachment.findUnique({
            where: { id: attachmentId },
            include: { message: true },
        });
        if (!attachment) {
            throw new common_1.NotFoundException('Attachment not found');
        }
        if (attachment.message.senderId !== userId) {
            throw new common_1.ForbiddenException('Cannot delete another user\'s media');
        }
        const publicUrl = this.minio.getPublicUrl('');
        const storageKey = attachment.url.replace(`${publicUrl}/`, '');
        const thumbnailKey = attachment.thumbnailUrl?.replace(`${publicUrl}/`, '');
        const keysToDelete = [storageKey];
        if (thumbnailKey)
            keysToDelete.push(thumbnailKey);
        await this.minio.deleteObjects(keysToDelete);
        await this.prisma.messageAttachment.update({
            where: { id: attachmentId },
            data: { deletedAt: new Date() },
        });
    }
    async getConversationMedia(conversationId, userId, type, limit = 50) {
        const membership = await this.prisma.conversationMember.findUnique({
            where: { conversationId_userId: { conversationId, userId } },
        });
        if (!membership || membership.leftAt) {
            throw new common_1.NotFoundException('Conversation not found');
        }
        const where = {
            message: {
                conversationId,
                deletedAt: null,
            },
            deletedAt: null,
        };
        if (type) {
            where.type = type;
        }
        return this.prisma.messageAttachment.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: limit,
            include: {
                message: {
                    select: { id: true, senderId: true, createdAt: true },
                },
            },
        });
    }
    async emitNewMessage(message) {
        await this.redis.publish(`conversation:${message.conversationId}`, JSON.stringify({
            type: 'new_message',
            payload: message,
            conversationId: message.conversationId,
        }));
    }
};
exports.MediaService = MediaService;
exports.MediaService = MediaService = MediaService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object, typeof (_b = typeof redis_service_1.RedisService !== "undefined" && redis_service_1.RedisService) === "function" ? _b : Object, minio_service_1.MinioService,
        media_validation_service_1.MediaValidationService,
        thumbnail_service_1.ThumbnailService])
], MediaService);
//# sourceMappingURL=media.service.js.map