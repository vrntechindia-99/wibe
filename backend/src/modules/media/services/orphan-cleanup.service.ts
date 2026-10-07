import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '@shared/database/prisma.service';
import { MinioService } from './minio.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class OrphanCleanupService {
  private readonly logger = new Logger(OrphanCleanupService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly minio: MinioService,
    private readonly configService: ConfigService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async cleanupOrphanedObjects() {
    this.logger.log('Starting orphaned object cleanup');

    try {
      await this.cleanupExpiredUploadSessions();
      await this.cleanupUnreferencedObjects();
      await this.cleanupFailedUploads();
      
      this.logger.log('Orphaned object cleanup completed');
    } catch (error) {
      this.logger.error('Orphaned object cleanup failed', error);
    }
  }

  private async cleanupExpiredUploadSessions() {
    // Clean up expired Redis sessions (handled by TTL)
    // But we can also clean up any orphaned multipart uploads in MinIO
    this.logger.debug('Upload sessions cleaned up via Redis TTL');
  }

  private async cleanupUnreferencedObjects() {
    const gracePeriodHours = this.configService.get<number>('ORPHAN_GRACE_PERIOD_HOURS') || 24;
    const cutoffDate = new Date(Date.now() - gracePeriodHours * 60 * 60 * 1000);

    // Find message attachments older than grace period that are not linked to any message
    // Actually, all attachments should be linked to messages. 
    // Check for objects in storage that don't have corresponding DB records.

    this.logger.debug('Checking for unreferenced objects in storage');

    try {
      // List all objects in media prefix
      const allObjects = await this.minio.listObjects('media/', true);
      this.logger.debug(`Found ${allObjects.length} objects in storage`);

      // Get all storage keys from database
      const dbAttachments = await this.prisma.messageAttachment.findMany({
        where: { deletedAt: null },
        select: { url: true, thumbnailUrl: true },
      });

      const dbKeys = new Set<string>();
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

      // Find orphaned objects
      const orphanedKeys = allObjects.filter(key => !dbKeys.has(key));

      if (orphanedKeys.length > 0) {
        this.logger.log(`Found ${orphanedKeys.length} potentially orphaned objects`);

        // Only delete objects older than grace period
        // For safety, we check the object's last modified time
        const keysToDelete: string[] = [];

        for (const key of orphanedKeys) {
          try {
            const stat = await this.minio['client'].statObject(this.minio['bucket'], key);
            if (stat.lastModified < cutoffDate) {
              keysToDelete.push(key);
            }
          } catch (error) {
            this.logger.warn(`Failed to stat object ${key}`, error);
          }
        }

        if (keysToDelete.length > 0) {
          await this.minio.deleteObjects(keysToDelete);
          this.logger.log(`Deleted ${keysToDelete.length} orphaned objects`);
        }
      }
    } catch (error) {
      this.logger.error('Failed to cleanup unreferenced objects', error);
    }
  }

  private async cleanupFailedUploads() {
    // Clean up multipart uploads that were started but never completed
    // This requires MinIO's listIncompleteUploads functionality
    this.logger.debug('Cleaning up incomplete multipart uploads');

    try {
      const incompleteUploads = await this.minio['client'].listIncompleteUploads(this.minio['bucket'], 'media/', true);
      
      const gracePeriodHours = this.configService.get<number>('ORPHAN_GRACE_PERIOD_HOURS') || 24;
      const cutoffDate = new Date(Date.now() - gracePeriodHours * 60 * 60 * 1000);

      let cleaned = 0;
      for await (const upload of incompleteUploads) {
        if (upload.initiated < cutoffDate) {
          try {
            await this.minio.abortMultipartUpload(upload.objectKey, upload.uploadId);
            cleaned++;
          } catch (error) {
            this.logger.warn(`Failed to abort upload ${upload.uploadId}`, error);
          }
        }
      }

      if (cleaned > 0) {
        this.logger.log(`Aborted ${cleaned} incomplete multipart uploads`);
      }
    } catch (error) {
      this.logger.error('Failed to cleanup incomplete uploads', error);
    }
  }

  // Manual trigger for testing
  async triggerCleanup() {
    await this.cleanupOrphanedObjects();
  }
}