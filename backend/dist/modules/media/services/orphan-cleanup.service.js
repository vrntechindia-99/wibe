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
var OrphanCleanupService_1;
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrphanCleanupService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const prisma_service_1 = require("@shared/database/prisma.service");
const minio_service_1 = require("./minio.service");
const config_1 = require("@nestjs/config");
let OrphanCleanupService = OrphanCleanupService_1 = class OrphanCleanupService {
    constructor(prisma, minio, configService) {
        this.prisma = prisma;
        this.minio = minio;
        this.configService = configService;
        this.logger = new common_1.Logger(OrphanCleanupService_1.name);
    }
    async cleanupOrphanedObjects() {
        this.logger.log('Starting orphaned object cleanup');
        try {
            await this.cleanupExpiredUploadSessions();
            await this.cleanupUnreferencedObjects();
            await this.cleanupFailedUploads();
            this.logger.log('Orphaned object cleanup completed');
        }
        catch (error) {
            this.logger.error('Orphaned object cleanup failed', error);
        }
    }
    async cleanupExpiredUploadSessions() {
        this.logger.debug('Upload sessions cleaned up via Redis TTL');
    }
    async cleanupUnreferencedObjects() {
        const gracePeriodHours = this.configService.get('ORPHAN_GRACE_PERIOD_HOURS') || 24;
        const cutoffDate = new Date(Date.now() - gracePeriodHours * 60 * 60 * 1000);
        this.logger.debug('Checking for unreferenced objects in storage');
        try {
            const allObjects = await this.minio.listObjects('media/', true);
            this.logger.debug(`Found ${allObjects.length} objects in storage`);
            const dbAttachments = await this.prisma.messageAttachment.findMany({
                where: { deletedAt: null },
                select: { url: true, thumbnailUrl: true },
            });
            const dbKeys = new Set();
            const publicUrl = this.minio.getPublicUrl('');
            for (const attachment of dbAttachments) {
                if (attachment.url) {
                    const key = attachment.url.replace(`${publicUrl}/`, '');
                    dbKeys.add(key);
                }
                if (attachment.thumbnailUrl) {
                    const key = attachment.thumbnailUrl.replace(`${publicUrl}/`, '');
                    dbKeys.add(key);
                }
            }
            const orphanedKeys = allObjects.filter(key => !dbKeys.has(key));
            if (orphanedKeys.length > 0) {
                this.logger.log(`Found ${orphanedKeys.length} potentially orphaned objects`);
                const keysToDelete = [];
                for (const key of orphanedKeys) {
                    try {
                        const stat = await this.minio['client'].statObject(this.minio['bucket'], key);
                        if (stat.lastModified < cutoffDate) {
                            keysToDelete.push(key);
                        }
                    }
                    catch (error) {
                        this.logger.warn(`Failed to stat object ${key}`, error);
                    }
                }
                if (keysToDelete.length > 0) {
                    await this.minio.deleteObjects(keysToDelete);
                    this.logger.log(`Deleted ${keysToDelete.length} orphaned objects`);
                }
            }
        }
        catch (error) {
            this.logger.error('Failed to cleanup unreferenced objects', error);
        }
    }
    async cleanupFailedUploads() {
        this.logger.debug('Cleaning up incomplete multipart uploads');
        try {
            const incompleteUploads = await this.minio['client'].listIncompleteUploads(this.minio['bucket'], 'media/', true);
            const gracePeriodHours = this.configService.get('ORPHAN_GRACE_PERIOD_HOURS') || 24;
            const cutoffDate = new Date(Date.now() - gracePeriodHours * 60 * 60 * 1000);
            let cleaned = 0;
            for await (const upload of incompleteUploads) {
                if (upload.initiated < cutoffDate) {
                    try {
                        await this.minio.abortMultipartUpload(upload.objectKey, upload.uploadId);
                        cleaned++;
                    }
                    catch (error) {
                        this.logger.warn(`Failed to abort upload ${upload.uploadId}`, error);
                    }
                }
            }
            if (cleaned > 0) {
                this.logger.log(`Aborted ${cleaned} incomplete multipart uploads`);
            }
        }
        catch (error) {
            this.logger.error('Failed to cleanup incomplete uploads', error);
        }
    }
    async triggerCleanup() {
        await this.cleanupOrphanedObjects();
    }
};
exports.OrphanCleanupService = OrphanCleanupService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_3AM),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], OrphanCleanupService.prototype, "cleanupOrphanedObjects", null);
exports.OrphanCleanupService = OrphanCleanupService = OrphanCleanupService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object, minio_service_1.MinioService, typeof (_b = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _b : Object])
], OrphanCleanupService);
//# sourceMappingURL=orphan-cleanup.service.js.map