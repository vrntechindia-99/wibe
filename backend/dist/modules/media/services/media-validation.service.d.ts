import { ConfigService } from '@nestjs/config';
export declare class MediaValidationService {
    private readonly configService;
    private readonly logger;
    private readonly allowedMimes;
    private readonly sizeLimits;
    private readonly maxImageDimension;
    private readonly maxVideoDuration;
    constructor(configService: ConfigService);
    validateMimeType(mediaType: string, mimeType: string): void;
    validateSize(mediaType: string, sizeBytes: number): void;
    validateFilename(filename: string): void;
    validateExtension(mediaType: string, filename: string, mimeType: string): void;
    validateFileContent(buffer: Buffer, mimeType: string): Promise<boolean>;
    sanitizeFilename(filename: string): string;
    generateChecksum(buffer: Buffer): string;
    validateUploadedFile(file: Express.Multer.File, mediaType: string): Promise<{
        valid: boolean;
        error?: string;
    }>;
}
