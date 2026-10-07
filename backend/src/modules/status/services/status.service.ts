import { Injectable, Logger, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@shared/database/prisma.service';
import { RedisService } from '@shared/database/redis.service';
import { Prisma, PrivacyLevel, MessageType } from '@prisma/client';

import { CreateStatusDto, UpdateStatusDto, StatusReplyDto } from '../dto/status.dto';
import { StatusPrivacyService } from './status-privacy.service';

@Injectable()
export class StatusService {
  private readonly logger = new Logger(StatusService.name);
  private readonly statusDurationHours = 24;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly privacyService: StatusPrivacyService,
  ) {}

  async createStatus(userId: string, dto: CreateStatusDto) {
    // Validate media URL if provided
    if (dto.type !== MessageType.TEXT && !dto.mediaUrl) {
      throw new BadRequestException('Media URL required for image/video status');
    }

    const expiresAt = new Date(Date.now() + this.statusDurationHours * 60 * 60 * 1000);

    const status = await this.prisma.status.create({
      data: {
        userId,
        type: dto.type,
        content: dto.content,
        mediaUrl: dto.mediaUrl,
        thumbnailUrl: dto.thumbnailUrl,
        privacy: dto.privacy,
        selectedUsers: dto.selectedUsers || [],
        expiresAt,
      },
      include: {
        user: { include: { profile: true } },
      },
    });

    // Emit real-time event
    await this.emitStatusCreated(status);

    return this.formatStatus(status);
  }

  async getUserStatuses(userId: string, requesterId: string) {
    const statuses = await this.prisma.status.findMany({
      where: {
        userId,
        deletedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { include: { profile: true } },
        views: { select: { userId: true, viewedAt: true } },
      },
    });

    // Filter by privacy
    const visible = await Promise.all(
      statuses.map(async (s) => {
        const canView = await this.privacyService.canViewStatus(s, requesterId);
        return canView ? this.formatStatus(s) : null;
      })
    );

    return visible.filter(Boolean);
  }

  async getContactStatuses(userId: string) {
    // Get statuses from contacts (direct conversations)
    const conversations = await this.prisma.conversation.findMany({
      where: {
        type: 'DIRECT',
        members: { some: { userId, leftAt: null } },
      },
      include: {
        members: {
          where: { userId: { not: userId }, leftAt: null },
          include: { user: { include: { profile: true } } },
        },
      },
    });

    const contactIds = conversations.flatMap(c =>
      c.members.map(m => m.userId)
    );

    const statuses = await this.prisma.status.findMany({
      where: {
        userId: { in: contactIds },
        deletedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { include: { profile: true } },
        views: { select: { userId: true, viewedAt: true } },
      },
    );

    // Filter by privacy
    const visible = await Promise.all(
      statuses.map(async (s) => {
        const canView = await this.privacyService.canViewStatus(s, userId);
        return canView ? this.formatStatus(s) : null;
      })
    );

    return visible.filter(Boolean);
  }

  async getStatus(statusId: string, requesterId: string) {
    const status = await this.prisma.status.findUnique({
      where: { id: statusId },
      include: {
        user: { include: { profile: true } },
        views: { select: { userId: true, viewedAt: true } },
      },
    });

    if (!status || status.deletedAt || status.expiresAt <= new Date()) {
      throw new NotFoundException('Status not found or expired');
    }

    const canView = await this.privacyService.canViewStatus(status, requesterId);
    if (!canView) {
      throw new ForbiddenException('Not authorized to view this status');
    }

    return this.formatStatus(status);
  }

  async viewStatus(statusId: string, viewerId: string) {
    const status = await this.prisma.status.findUnique({
      where: { id: statusId },
    });

    if (!status || status.deletedAt || status.expiresAt <= new Date()) {
      throw new NotFoundException('Status not found or expired');
    }

    const canView = await this.privacyService.canViewStatus(status, viewerId);
    if (!canView) {
      throw new ForbiddenException('Not authorized to view this status');
    }

    // Record view
    await this.prisma.statusView.upsert({
      where: { statusId_viewerId: { statusId, viewerId } },
      create: { statusId, viewerId },
      update: { viewedAt: new Date() },
    });

    // Emit view event
    await this.emitStatusViewed(statusId, viewerId);

    return { message: 'Status viewed' };
  }

  async replyToStatus(statusId: string, userId: string, dto: StatusReplyDto) {
    const status = await this.prisma.status.findUnique({
      where: { id: statusId },
      include: { user: true },
    });

    if (!status || status.deletedAt || status.expiresAt <= new Date()) {
      throw new NotFoundException('Status not found or expired');
    }

    const canView = await this.privacyService.canViewStatus(status, userId);
    if (!canView) {
      throw new ForbiddenException('Not authorized to reply to this status');
    }

    // Create a direct message as reply
    // First find or create direct conversation
    let conversation = await this.prisma.conversation.findFirst({
      where: {
        type: 'DIRECT',
        members: {
          every: { userId: { in: [userId, status.userId] }, leftAt: null },
        },
      },
    });

    if (!conversation) {
      conversation = await this.prisma.conversation.create({
        data: {
          type: 'DIRECT',
          createdBy: userId,
          members: {
            create: [
              { userId, role: 'MEMBER' },
              { userId: status.userId, role: 'MEMBER' },
            ],
          },
        },
      });
    }

    // Send reply message
    const replyMessage = await this.prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: userId,
        clientMessageId: `reply-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'TEXT',
        content: `Reply to status: ${dto.content}`,
        status: 'SENT',
      },
      include: { sender: { include: { profile: true } } },
    });

    // Emit events
    await this.emitStatusReplied(statusId, userId, dto.content);

    return this.formatMessage(replyMessage);
  }

  async addReaction(statusId: string, userId: string, emoji: string) {
    const status = await this.prisma.status.findUnique({
      where: { id: statusId },
    });

    if (!status || status.deletedAt || status.expiresAt <= new Date()) {
      throw new NotFoundException('Status not found or expired');
    }

    const canView = await this.privacyService.canViewStatus(status, userId);
    if (!canView) {
      throw new ForbiddenException('Not authorized to react to this status');
    }

    // For now, store reactions in a simple way
    // In production, you'd have a StatusReaction model
    await this.redis.sadd(`status:${statusId}:reactions:${emoji}`, userId);

    // Emit event
    await this.emitStatusReactionAdded(statusId, userId, emoji);

    return { message: 'Reaction added' };
  }

  async removeReaction(statusId: string, userId: string, emoji: string) {
    await this.redis.srem(`status:${statusId}:reactions:${emoji}`, userId);
    await this.emitStatusReactionRemoved(statusId, userId, emoji);
    return { message: 'Reaction removed' };
  }

  async getReactions(statusId: string, userId: string) {
    const status = await this.prisma.status.findUnique({
      where: { id: statusId },
    });

    if (!status || status.deletedAt || status.expiresAt <= new Date()) {
      throw new NotFoundException('Status not found or expired');
    }

    const canView = await this.privacyService.canViewStatus(status, userId);
    if (!canView) {
      throw new ForbiddenException('Not authorized to view reactions');
    }

    // Get reactions from Redis
    const allowedEmojis = ['❤️', '😂', '👍', '😮', '😢', '🔥'];
    const reactions = [];

    for (const emoji of allowedEmojis) {
      const users = await this.redis.smembers(`status:${statusId}:reactions:${emoji}`);
      if (users.length > 0) {
        reactions.push({ emoji, count: users.length, users });
      }
    }

    return reactions;
  }

  async deleteStatus(statusId: string, userId: string) {
    const status = await this.prisma.status.findUnique({
      where: { id: statusId },
    });

    if (!status) {
      throw new NotFoundException('Status not found');
    }

    if (status.userId !== userId) {
      throw new ForbiddenException('Can only delete your own status');
    }

    await this.prisma.status.update({
      where: { id: statusId },
      data: { deletedAt: new Date() },
    });

    await this.emitStatusDeleted(statusId);

    return { message: 'Status deleted' };
  }

  async updateStatus(statusId: string, userId: string, dto: UpdateStatusDto) {
    const status = await this.prisma.status.findUnique({
      where: { id: statusId },
    });

    if (!status) {
      throw new NotFoundException('Status not found');
    }

    if (status.userId !== userId) {
      throw new ForbiddenException('Can only update your own status');
    }

    const updated = await this.prisma.status.update({
      where: { id: statusId },
      data: {
        content: dto.content,
        privacy: dto.privacy,
        selectedUsers: dto.selectedUsers,
      },
      include: { user: { include: { profile: true } } },
    });

    await this.emitStatusUpdated(updated);

    return this.formatStatus(updated);
  }

  private formatStatus(status: any) {
    return {
      id: status.id,
      userId: status.userId,
      type: status.type,
      content: status.content,
      mediaUrl: status.mediaUrl,
      thumbnailUrl: status.thumbnailUrl,
      privacy: status.privacy,
      selectedUsers: status.selectedUsers,
      expiresAt: status.expiresAt,
      createdAt: status.createdAt,
      views: status.views?.map((v: any) => ({
        userId: v.userId,
        viewedAt: v.viewedAt,
      })) || [],
      viewCount: status.views?.length || 0,
      user: status.user ? {
        id: status.user.id,
        displayName: status.user.profile?.displayName,
        avatarUrl: status.user.profile?.avatarUrl,
      } : undefined,
    };
  }

  private formatMessage(message: any) {
    return {
      id: message.id,
      clientMessageId: message.clientMessageId,
      conversationId: message.conversationId,
      senderId: message.senderId,
      type: message.type,
      content: message.content,
      status: message.status,
      createdAt: message.createdAt,
      sender: message.sender ? {
        id: message.sender.id,
        displayName: message.sender.profile?.displayName,
        avatarUrl: message.sender.profile?.avatarUrl,
      } : undefined,
    };
  }

  // Real-time event emitters
  private async emitStatusCreated(status: any) {
    const event = { type: 'status_created', payload: this.formatStatus(status) };
    await this.redis.publish('status_events', JSON.stringify(event));
  }

  private async emitStatusUpdated(status: any) {
    const event = { type: 'status_updated', payload: this.formatStatus(status) };
    await this.redis.publish('status_events', JSON.stringify(event));
  }

  private async emitStatusDeleted(statusId: string) {
    const event = { type: 'status_deleted', payload: { statusId } };
    await this.redis.publish('status_events', JSON.stringify(event));
  }

  private async emitStatusViewed(statusId: string, viewerId: string) {
    const event = { type: 'status_viewed', payload: { statusId, viewerId } };
    await this.redis.publish('status_events', JSON.stringify(event));
  }

  private async emitStatusReplied(statusId: string, userId: string, content: string) {
    const event = { type: 'status_replied', payload: { statusId, userId, content } };
    await this.redis.publish('status_events', JSON.stringify(event));
  }

  private async emitStatusReactionAdded(statusId: string, userId: string, emoji: string) {
    const event = { type: 'status_reaction_added', payload: { statusId, userId, emoji } };
    await this.redis.publish('status_events', JSON.stringify(event));
  }

  private async emitStatusReactionRemoved(statusId: string, userId: string, emoji: string) {
    const event = { type: 'status_reaction_removed', payload: { statusId, userId, emoji } };
    await this.redis.publish('status_events', JSON.stringify(event));
  }
}