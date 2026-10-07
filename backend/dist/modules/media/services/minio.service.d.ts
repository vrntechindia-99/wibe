import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export declare class MinioService implements OnModuleInit {
    private readonly configService;
    private readonly logger;
    private client;
    private readonly bucket;
    private readonly publicUrl;
    constructor(configService: ConfigService);
    onModuleInit(): Promise<void>;
    private ensureBucketExists;
    generateStorageKey(userId: string, mediaType: string, originalFilename: string): string;
    generateThumbnailKey(storageKey: string): string;
    getPresignedUploadUrl(storageKey: string, contentType: string, expiresIn?: number): Promise<string>;
    getPresignedDownloadUrl(storageKey: string, expiresIn?: number, responseContentDisposition?: string): Promise<string>;
    getPresignedUploadUrlForMultipart(storageKey: string, contentType: string, partNumber: number, uploadId: string, expiresIn?: number): Promise<string>;
    createMultipartUpload(storageKey: string, contentType: string): Promise<string>;
    completeMultipartUpload(storageKey: string, uploadId: string, parts: Array<{
        partNumber: number;
        etag: string;
    }>): Promise<void>;
    abortMultipartUpload(storageKey: string, uploadId: string): Promise<void>;
    objectExists(storageKey: string): Promise<boolean>;
    getObjectSize(storageKey: string): Promise<number>;
    deleteObject(storageKey: string): Promise<void>;
    deleteObjects(storageKeys: string[]): Promise<void>;
    copyObject(sourceKey: string, destKey: string): Promise<void>;
    getPublicUrl(storageKey: string): string;
    listObjects(prefix: string, recursive?: boolean): Promise<string[]>;
}
