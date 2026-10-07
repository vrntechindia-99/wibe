import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '@shared/database/prisma.service';
import { RedisService } from '@shared/database/redis.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CallCleanupService {
  private readonly logger = new Logger(CallCleanupService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly configService: ConfigService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async cleanupStaleCalls() {
    this.logger.log('Starting stale call cleanup');

    try {
      // Find calls stuck in non-terminal states for too long
      const staleThreshold = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago

      const staleCalls = await this.prisma.call.findMany({
        where: {
          status: {
            in: ['INITIATING', 'RINGING', 'ACCEPTED', 'CONNECTING', 'CONNECTED', 'RECONNECTING'],
          },
          updatedAt: { lt: staleThreshold },
        },
        select: { id: true, status: true, callerId: true, recipientId: true },
      });

      for (const call of staleCalls) {
        await this.handleStaleCall(call);
      }

      this.logger.log(`Cleaned up ${staleCalls.length} stale calls`);
    } catch (error) {
      this.logger.error('Stale call cleanup failed', error);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async cleanupOldCallRecords() {
    this.logger.log('Starting old call record cleanup');

    try {
      const retentionDays = this.configService.get<number>('CALL_RETENTION_DAYS') || 90;
      const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

      // Delete old completed calls
      const result = await this.prisma.call.deleteMany({
        where: {
          status: { in: ['ENDED', 'MISSED', 'DECLINED', 'CANCELLED', 'FAILED'] },
          endedAt: { lt: cutoffDate },
        },
      });

      this.logger.log(`Deleted ${result.count} old call records`);
    } catch (error) {
      this.logger.error('Old call record cleanup failed', error);
    }
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  async cleanupRedisSignalingData() {
    // Clean up orphaned Redis signaling data
    try {
      const keys = await this.redis.keys('call:*:offer:*');
      keys.push(...await this.redis.keys('call:*:answer:*'));
      keys.push(...await this.redis.keys('call:*:ice:*'));
      keys.push(...await this.redis.keys('call:*:state'));
      keys.push(...await this.redis.keys('call:*:timeout'));

      let cleaned = 0;
      for (const key of keys) {
        const ttl = await this.redis.ttl(key);
        if (ttl === -1) {
          // Key exists but has no expiry - might be orphaned
          await this.redis.del(key);
          cleaned++;
        }
      }

      if (cleaned > 0) {
        this.logger.debug(`Cleaned up ${cleaned} orphaned Redis signaling keys`);
      }
    } catch (error) {
      this.logger.error('Redis signaling cleanup failed', error);
    }
  }

  private async handleStaleCall(call: { id: string; status: string; callerId: string; recipientId: string }) {
    this.logger.warn(`Handling stale call ${call.id} in state ${call.status}`);

    // Determine end reason based on current state
    let endReason = 'TIMEOUT';
    if (call.status === 'RINGING') {
      endReason = 'MISSED';
    } else if (['INITIATING', 'ACCEPTED', 'CONNECTING'].includes(call.status)) {
      endReason = 'TIMEOUT';
    } else if (['CONNECTED', 'RECONNECTING'].includes(call.status)) {
      endReason = 'NETWORK_FAILURE';
    }

    // Update call status
    await this.prisma.call.update({
      where: { id: call.id },
      data: {
        status: endReason === 'MISSED' ? 'MISSED' : 'FAILED',
        endedAt: new Date(),
        endReason,
      },
    });

    // Notify participants via Redis
    await this.redis.publish(`user:${call.callerId}:calls`, JSON.stringify({
      type: endReason === 'MISSED' ? 'call_missed' : 'call_failed',
      callId: call.id,
    }));

    await this.redis.publish(`user:${call.recipientId}:calls`, JSON.stringify({
      type: endReason === 'MISSED' ? 'call_missed' : 'call_failed',
      callId: call.id,
    }));

    // Clean up Redis signaling data
    await this.redis.del(
      `call:${call.id}:state`,
      `call:${call.id}:timeout`,
      `call:${call.id}:offer:*`,
      `call:${call.id}:answer:*`,
      `call:${call.id}:ice:*`,
    );
  }
}