import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@shared/database/prisma.service';
import { RedisService } from '@shared/database/redis.service';
import { PrivacyService } from '@modules/users/services/privacy.service';
import { PrivacyLevel } from '@prisma/client';

@Injectable()
export class PresenceService {
  private readonly logger = new Logger(PresenceService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly privacyService: PrivacyService,
  ) {}

  async getPresence(userId: string, requesterId: string) {
    // Check privacy settings
    const canView = await this.privacyService.canViewLastSeen(userId, requesterId);

    if (!canView) {
      return { online: false, lastSeen: null };
    }

    const isOnline = await this.redis.isUserOnline(userId);

    if (!isOnline) {
      // Get last seen from profile
      const profile = await this.prisma.userProfile.findUnique({
        where: { userId },
        select: { updatedAt: true },
      });

      return {
        online: false,
        lastSeen: profile?.updatedAt || null,
      };
    }

    return { online: true, lastSeen: null };
  }

  async getOnlineUsers(userIds: string[], requesterId: string) {
    const results: Record<string, { online: boolean; lastSeen: Date | null }> = {};

    for (const userId of userIds) {
      results[userId] = await this.getPresence(userId, requesterId);
    }

    return results;
  }

  async getConversationPresence(conversationId: string, userId: string) {
    const members = await this.prisma.conversationMember.findMany({
      where: { conversationId, leftAt: null },
      select: { userId: true },
    });

    const userIds = members.map(m => m.userId).filter(id => id !== userId);
    return this.getOnlineUsers(userIds, userId);
  }

  async updateLastActive(userId: string) {
    await this.prisma.userProfile.update({
      where: { userId },
      data: { updatedAt: new Date() },
    });
  }

  async isOnline(userId: string): Promise<boolean> {
    return this.redis.isUserOnline(userId);
  }
}