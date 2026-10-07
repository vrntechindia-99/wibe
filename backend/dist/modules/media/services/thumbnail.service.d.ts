import { ConfigService } from '@nestjs/config';
export declare class ThumbnailService {
    private readonly configService;
    private readonly logger;
    private readonly imageThumbnailSize;
    private readonly videoThumbnailTime;
    constructor(configService: ConfigService);
    generateImageThumbnail(buffer: Buffer, options?: {
        width?: number;
        height?: number;
    }): Promise<Buffer>;
    generateVideoThumbnail(buffer: Buffer): Promise<Buffer>;
    extractImageMetadata(buffer: Buffer): Promise<{
        width: number;
        height: number;
        format: string;
    }>;
    extractVideoMetadata(buffer: Buffer): Promise<{
        width: number;
        height: number;
        duration: number;
        format: string;
    }>;
    compressImage(buffer: Buffer, options?: {
        quality?: number;
        maxWidth?: number;
        maxHeight?: number;
    }): Promise<Buffer>;
}
