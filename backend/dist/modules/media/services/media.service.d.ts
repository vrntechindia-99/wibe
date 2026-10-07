import { PrismaService } from '@shared/database/prisma.service';
import { RedisService } from '@shared/database/redis.service';
import { MinioService } from './minio.service';
import { MediaValidationService } from './media-validation.service';
import { ThumbnailService } from './thumbnail.service';
import { CreateUploadSessionDto } from '../dto/create-upload-session.dto';
import { CompleteUploadDto } from '../dto/complete-upload.dto';
export declare class MediaService {
    private readonly prisma;
    private readonly redis;
    private readonly minio;
    private readonly validation;
    private readonly thumbnail;
    private readonly logger;
    private readonly sessionTtl;
    constructor(prisma: PrismaService, redis: RedisService, minio: MinioService, validation: MediaValidationService, thumbnail: ThumbnailService);
    createUploadSession(userId: string, dto: CreateUploadSessionDto): Promise<{
        uploadSessionId: string;
        uploadUrl: string;
        storageKey: string;
        thumbnailKey?: string;
    }>;
    createMultipartUploadSession(userId: string, dto: CreateUploadSessionDto): Promise<{
        uploadSessionId: string;
        uploadId: string;
        storageKey: string;
        thumbnailKey?: string;
    }>;
    getPresignedPartUrl(uploadSessionId: string, partNumber: number): Promise<string>;
    completeMultipartUpload(userId: string, dto: CompleteUploadDto): Promise<{
        messageId: string;
        attachment: any;
    }>;
    completeSinglePartUpload(userId: string, dto: CompleteUploadDto): Promise<{
        messageId: string;
        attachment: any;
    }>;
    getMediaAttachment(attachmentId: string, userId: string): Promise<any>;
    getPresignedDownloadUrl(attachmentId: string, userId: string): Promise<string>;
    deleteMedia(attachmentId: string, userId: string): Promise<void>;
    getConversationMedia(conversationId: string, userId: string, type?: string, limit?: number): Promise<any>;
    private emitNewMessage;
}
