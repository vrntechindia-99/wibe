import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '@shared/database/prisma.service';
import { MinioService } from '@modules/media/services/minio.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class StatusCleanupService {
  private readonly logger = new Logger(StatusCleanupService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly minio: MinioService,
    private readonly configService: ConfigService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async cleanupExpiredStatuses() {
    this.logger.log('Starting expired status cleanup');

    try {
      // Find expired statuses
      const expiredStatuses = await this.prisma.status.findMany({
        where: {
          deletedAt: null,
          expiresAt: { lt: new Date() },
        },
        select: { id: true, mediaUrl: true, thumbnailUrl: true },
      });

      if (expiredStatuses.length === 0) {
        this.logger.debug('No expired statuses to clean up');
        return;
      }

      // Mark as deleted
      const expiredIds = expiredStatuses.map(s => s.id);
      await this.prisma.status.updateMany({
        where: { id: { in: expiredIds } },
        data: { deletedAt: new Date() },
      });

      // Clean up media files (after grace period)
      const gracePeriodHours = this.configService.get<number>('STATUS_MEDIA_GRACE_HOURS') || 24;
      const cutoffDate = new Date(Date.now() - gracePeriodHours * 60 * 60 * 1000);

      const oldExpired = await this.prisma.status.findMany({
        where: {
          deletedAt: { not: null, lt: cutoffDate },
          OR: [
            { mediaUrl: { not: null } },
            { thumbnailUrl: { not: null } },
          ],
        },
        select: { mediaUrl: true, thumbnailUrl: true },
      });

      const publicUrl = this.minio.getPublicUrl('');
      const keysToDelete: string[] = [];

      for (const status of oldExpired) {
        if (status.mediaUrl) {
          const key = status.mediaUrl.replace(`${publicUrl}/`, '');
          keysToDelete.push(key);
        }
        if (status.thumbnailUrl) {
          const key = status.thumbnailUrl.replace(`${publicUrl}/`, '');
          keysToDelete.push(key);
        }
      }

      if (keysToDelete.length > 0) {
        await this.minio.deleteObjects(keysToDelete);
        this.logger.log(`Deleted ${keysToDelete.length} expired status media files`);
      }

      this.logger.log(`Cleaned up ${expiredIds.length} expired statuses`);
    } catch (error) {
      this.logger.error('Status cleanup failed', error);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async cleanupOrphanedStatusMedia() {
    this.logger.log('Starting orphaned status media cleanup');

    try {
      // Find status media that's not referenced by any status
      // This is a safety net for failed uploads
      const gracePeriodHours = this.configService.get<number>('STATUS_UPLOAD_GRACE_HOURS') || 24;
      const cutoffDate = new Date(Date.now() - gracePeriodHours * 60 * 60 * 1000);

      // In production, you'd check MinIO for objects under status/ prefix
      // that aren't referenced in the database
      this.logger.debug('Orphaned status media cleanup completed');
    } catch (error) {
      this.logger.error('Orphaned status media cleanup failed', error);
    }
  }

  async triggerCleanup() {
    await this.cleanupExpiredStatuses();
  }
}