import { Request } from 'express';
import { MediaService } from './services/media.service';
import { CreateUploadSessionDto, MediaType } from './dto/create-upload-session.dto';
import { CompleteUploadDto } from './dto/complete-upload.dto';
export declare class MediaController {
    private readonly mediaService;
    constructor(mediaService: MediaService);
    createUploadSession(dto: CreateUploadSessionDto, req: Request): Promise<{
        uploadSessionId: string;
        uploadUrl: string;
        storageKey: string;
        thumbnailKey?: string;
    }>;
    createMultipartUploadSession(dto: CreateUploadSessionDto, req: Request): Promise<{
        uploadSessionId: string;
        uploadId: string;
        storageKey: string;
        thumbnailKey?: string;
    }>;
    getPartUploadUrl(sessionId: string, partNumber: number): Promise<string>;
    completeMultipartUpload(sessionId: string, dto: CompleteUploadDto, req: Request): Promise<{
        messageId: string;
        attachment: any;
    }>;
    completeSinglePartUpload(sessionId: string, dto: CompleteUploadDto, req: Request): Promise<{
        messageId: string;
        attachment: any;
    }>;
    getAttachment(attachmentId: string, req: Request): Promise<any>;
    getDownloadUrl(attachmentId: string, req: Request): Promise<{
        downloadUrl: string;
    }>;
    deleteAttachment(attachmentId: string, req: Request): Promise<{
        message: string;
    }>;
    getConversationMedia(conversationId: string, type: MediaType, limit: number, req: Request): Promise<any>;
}
