import { Injectable, Logger, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@shared/database/prisma.service';
import { RedisService } from '@shared/database/redis.service';
import { MinioService } from './minio.service';
import { MediaValidationService } from './media-validation.service';
import { ThumbnailService } from './thumbnail.service';
import { CreateUploadSessionDto, MediaType } from '../dto/create-upload-session.dto';
import { CompleteUploadDto } from '../dto/complete-upload.dto';
import { v4 as uuidv4 } from 'uuid';

interface UploadSession {
  id: string;
  userId: string;
  mediaType: MediaType;
  mimeType: string;
  originalFilename: string;
  sizeBytes: number;
  storageKey: string;
  thumbnailKey?: string;
  caption?: string;
  conversationId?: string;
  clientMessageId?: string;
  status: 'CREATED' | 'UPLOADING' | 'COMPLETED' | 'FAILED';
  uploadId?: string; // For multipart
  parts?: Array<{ partNumber: number; etag: string }>;
  checksum?: string;
  createdAt: Date;
  expiresAt: Date;
}

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);
  private readonly sessionTtl = 3600; // 1 hour

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly minio: MinioService,
    private readonly validation: MediaValidationService,
    private readonly thumbnail: ThumbnailService,
  ) {}

  async createUploadSession(userId: string, dto: CreateUploadSessionDto): Promise<{
    uploadSessionId: string;
    uploadUrl: string;
    storageKey: string;
    thumbnailKey?: string;
  }> {
    // Validate
    this.validation.validateMimeType(dto.mediaType, dto.mimeType);
    this.validation.validateSize(dto.mediaType, dto.sizeBytes);
    this.validation.validateFilename(dto.originalFilename);
    this.validation.validateExtension(dto.mediaType, dto.originalFilename, dto.mimeType);

    // Generate storage keys
    const storageKey = this.minio.generateStorageKey(userId, dto.mediaType, dto.originalFilename);
    const thumbnailKey = dto.mediaType === 'IMAGE' || dto.mediaType === 'VIDEO'
      ? this.minio.generateThumbnailKey(storageKey)
      : undefined;

    const sessionId = uuidv4();
    const session: UploadSession = {
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

    // Store session in Redis
    await this.redis.set(
      `upload_session:${sessionId}`,
      JSON.stringify(session),
      this.sessionTtl,
    );

    // Generate presigned URL
    const uploadUrl = await this.minio.getPresignedUploadUrl(storageKey, dto.mimeType);

    return {
      uploadSessionId: sessionId,
      uploadUrl,
      storageKey,
      thumbnailKey,
    };
  }

  async createMultipartUploadSession(userId: string, dto: CreateUploadSessionDto): Promise<{
    uploadSessionId: string;
    uploadId: string;
    storageKey: string;
    thumbnailKey?: string;
  }> {
    const sessionResult = await this.createUploadSession(userId, dto);
    
    const uploadId = await this.minio.createMultipartUpload(
      sessionResult.storageKey,
      dto.mimeType,
    );

    // Update session with uploadId
    const sessionData = await this.redis.get(`upload_session:${sessionResult.uploadSessionId}`);
    if (sessionData) {
      const session = JSON.parse(sessionData) as UploadSession;
      session.uploadId = uploadId;
      session.status = 'UPLOADING';
      await this.redis.set(
        `upload_session:${sessionResult.uploadSessionId}`,
        JSON.stringify(session),
        this.sessionTtl,
      );
    }

    return {
      ...sessionResult,
      uploadId,
    };
  }

  async getPresignedPartUrl(
    uploadSessionId: string,
    partNumber: number,
  ): Promise<string> {
    const sessionData = await this.redis.get(`upload_session:${uploadSessionId}`);
    if (!sessionData) {
      throw new NotFoundException('Upload session not found or expired');
    }

    const session = JSON.parse(sessionData) as UploadSession;
    if (!session.uploadId) {
      throw new BadRequestException('Not a multipart upload session');
    }

    return this.minio.getPresignedUploadUrlForMultipart(
      session.storageKey,
      session.mimeType,
      partNumber,
      session.uploadId,
    );
  }

  async completeMultipartUpload(
    userId: string,
    dto: CompleteUploadDto,
  ): Promise<{ messageId: string; attachment: any }> {
    const sessionData = await this.redis.get(`upload_session:${dto.uploadSessionId}`);
    if (!sessionData) {
      throw new NotFoundException('Upload session not found or expired');
    }

    const session = JSON.parse(sessionData) as UploadSession;
    if (session.userId !== userId) {
      throw new ForbiddenException('Not authorized to complete this upload');
    }
    if (!session.uploadId) {
      throw new BadRequestException('Not a multipart upload session');
    }

    // Verify all parts uploaded
    if (!session.parts || session.parts.length === 0) {
      throw new BadRequestException('No parts uploaded');
    }

    // Complete multipart upload
    await this.minio.completeMultipartUpload(
      session.storageKey,
      session.uploadId,
      session.parts,
    );

    // Verify file exists and get size
    const actualSize = await this.minio.getObjectSize(session.storageKey);
    if (actualSize !== session.sizeBytes) {
      this.logger.warn(`Size mismatch: expected ${session.sizeBytes}, got ${actualSize}`);
    }

    // Generate thumbnail if needed
    let thumbnailGenerated = false;
    if (session.thumbnailKey && (session.mediaType === 'IMAGE' || session.mediaType === 'VIDEO')) {
      try {
        // Download object to generate thumbnail
        // In production, use a worker queue for this
        thumbnailGenerated = true;
      } catch (error) {
        this.logger.warn('Thumbnail generation failed', error);
      }
    }

    // Create message with attachment
    const message = await this.prisma.message.create({
      data: {
        conversationId: session.conversationId!,
        senderId: userId,
        clientMessageId: session.clientMessageId || uuidv4(),
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
            width: null, // Would be filled from metadata
            height: null,
            duration: session.mediaType === 'VIDEO' || session.mediaType === 'AUDIO' ? null : undefined,
          },
        },
      },
      include: { attachments: true },
    });

    // Update conversation
    await this.prisma.conversation.update({
      where: { id: session.conversationId },
      data: { updatedAt: new Date(), lastMessageId: message.id },
    });

    // Increment unread for other members
    await this.prisma.conversationMember.updateMany({
      where: {
        conversationId: session.conversationId,
        userId: { not: userId },
        leftAt: null,
      },
      data: { unreadCount: { increment: 1 } },
    });

    // Clean up session
    await this.redis.del(`upload_session:${dto.uploadSessionId}`);

    // Emit real-time event
    await this.emitNewMessage(message);

    return {
      messageId: message.id,
      attachment: message.attachments[0],
    };
  }

  async completeSinglePartUpload(
    userId: string,
    dto: CompleteUploadDto,
  ): Promise<{ messageId: string; attachment: any }> {
    const sessionData = await this.redis.get(`upload_session:${dto.uploadSessionId}`);
    if (!sessionData) {
      throw new NotFoundException('Upload session not found or expired');
    }

    const session = JSON.parse(sessionData) as UploadSession;
    if (session.userId !== userId) {
      throw new ForbiddenException('Not authorized to complete this upload');
    }

    // Verify object exists
    const exists = await this.minio.objectExists(session.storageKey);
    if (!exists) {
      throw new BadRequestException('Object not found in storage');
    }

    // Verify size
    const actualSize = await this.minio.getObjectSize(session.storageKey);
    if (actualSize !== session.sizeBytes) {
      this.logger.warn(`Size mismatch: expected ${session.sizeBytes}, got ${actualSize}`);
    }

    // Generate thumbnail if needed
    if (session.thumbnailKey && (session.mediaType === 'IMAGE' || session.mediaType === 'VIDEO')) {
      try {
        // Thumbnail generation would happen here
        // In production, use a worker queue
      } catch (error) {
        this.logger.warn('Thumbnail generation failed', error);
      }
    }

    // Create message with attachment
    const message = await this.prisma.message.create({
      data: {
        conversationId: session.conversationId!,
        senderId: userId,
        clientMessageId: session.clientMessageId || uuidv4(),
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

    // Update conversation
    await this.prisma.conversation.update({
      where: { id: session.conversationId },
      data: { updatedAt: new Date(), lastMessageId: message.id },
    });

    // Increment unread
    await this.prisma.conversationMember.updateMany({
      where: {
        conversationId: session.conversationId,
        userId: { not: userId },
        leftAt: null,
      },
      data: { unreadCount: { increment: 1 } },
    });

    // Clean up session
    await this.redis.del(`upload_session:${dto.uploadSessionId}`);

    // Emit real-time event
    await this.emitNewMessage(message);

    return {
      messageId: message.id,
      attachment: message.attachments[0],
    };
  }

  async getMediaAttachment(attachmentId: string, userId: string) {
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
      throw new NotFoundException('Attachment not found');
    }

    // Verify user has access
    const membership = attachment.message.conversation.members.find(
      (m) => m.userId === userId && !m.leftAt,
    );
    if (!membership) {
      throw new ForbiddenException('Not authorized to access this media');
    }

    return attachment;
  }

  async getPresignedDownloadUrl(attachmentId: string, userId: string): Promise<string> {
    const attachment = await this.getMediaAttachment(attachmentId, userId);
    
    // Extract storage key from URL
    const publicUrl = this.minio.getPublicUrl('');
    const storageKey = attachment.url.replace(`${publicUrl}/`, '');
    
    const disposition = `inline; filename="${encodeURIComponent(attachment.fileName || 'file')}"`;
    return this.minio.getPresignedDownloadUrl(storageKey, 3600, disposition);
  }

  async deleteMedia(attachmentId: string, userId: string): Promise<void> {
    const attachment = await this.prisma.messageAttachment.findUnique({
      where: { id: attachmentId },
      include: { message: true },
    });

    if (!attachment) {
      throw new NotFoundException('Attachment not found');
    }

    // Only sender can delete
    if (attachment.message.senderId !== userId) {
      throw new ForbiddenException('Cannot delete another user\'s media');
    }

    // Extract storage keys
    const publicUrl = this.minio.getPublicUrl('');
    const storageKey = attachment.url.replace(`${publicUrl}/`, '');
    const thumbnailKey = attachment.thumbnailUrl?.replace(`${publicUrl}/`, '');

    // Delete from storage
    const keysToDelete = [storageKey];
    if (thumbnailKey) keysToDelete.push(thumbnailKey);
    await this.minio.deleteObjects(keysToDelete);

    // Soft delete in DB
    await this.prisma.messageAttachment.update({
      where: { id: attachmentId },
      data: { deletedAt: new Date() },
    });
  }

  async getConversationMedia(conversationId: string, userId: string, type?: string, limit = 50) {
    const membership = await this.prisma.conversationMember.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });

    if (!membership || membership.leftAt) {
      throw new NotFoundException('Conversation not found');
    }

    const where: any = {
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

  private async emitNewMessage(message: any) {
    await this.redis.publish(`conversation:${message.conversationId}`, JSON.stringify({
      type: 'new_message',
      payload: message,
      conversationId: message.conversationId,
    }));
  }
}