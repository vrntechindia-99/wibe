import { PrismaService } from '@shared/database/prisma.service';
import { MinioService } from './minio.service';
import { ConfigService } from '@nestjs/config';
export declare class OrphanCleanupService {
    private readonly prisma;
    private readonly minio;
    private readonly configService;
    private readonly logger;
    constructor(prisma: PrismaService, minio: MinioService, configService: ConfigService);
    cleanupOrphanedObjects(): Promise<void>;
    private cleanupExpiredUploadSessions;
    private cleanupUnreferencedObjects;
    private cleanupFailedUploads;
    triggerCleanup(): Promise<void>;
}
