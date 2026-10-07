import { Injectable, NotFoundException, ForbiddenException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@shared/database/prisma.service';
import { RedisService } from '@shared/database/redis.service';
import { Prisma } from '@prisma/client';

import { AddReactionDto } from '../dto/add-reaction.dto';

@Injectable()
export class ReactionsService {
  private readonly logger = new Logger(ReactionsService.name);

  // Allowed emoji catalog - can be configured
  private readonly allowedEmojis = [
    '❤️', '😂', '👍', '😮', '😢', '🔥', '👏', '🙏', '🎉', '💯',
    '😍', '🤔', '😭', '😡', '👎', '🤷', '🙌', '💪', '🌟', '✨',
  ];

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async addReaction(messageId: string, userId: string, dto: AddReactionDto) {
    // Validate emoji
    if (!this.allowedEmojis.includes(dto.emoji)) {
      throw new BadRequestException('Invalid emoji');
    }

    // Verify message exists and user has access
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      include: {
        conversation: {
          include: {
            members: { where: { userId, leftAt: null } },
          },
        },
      },
    });

    if (!message || message.deletedAt) {
      throw new NotFoundException('Message not found');
    }

    // Verify membership
    const membership = message.conversation.members[0];
    if (!membership) {
      throw new ForbiddenException('Not a member of this conversation');
    }

    // Check if user already reacted with this emoji
    const existing = await this.prisma.messageReaction.findUnique({
      where: {
        messageId_userId_emoji: {
          messageId,
          userId,
          emoji: dto.emoji,
        },
      },
    });

    if (existing) {
      throw new ConflictException('Reaction already exists');
    }

    // Create reaction
    const reaction = await this.prisma.messageReaction.create({
      data: {
        messageId,
        userId,
        emoji: dto.emoji,
      },
      include: {
        user: { include: { profile: true } },
      },
    });

    // Emit real-time event
    await this.emitReactionAdded(messageId, reaction);

    return this.formatReaction(reaction);
  }

  async removeReaction(messageId: string, userId: string, emoji: string) {
    // Verify message exists and user has access
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      include: {
        conversation: {
          include: {
            members: { where: { userId, leftAt: null } },
          },
        },
      },
    });

    if (!message || message.deletedAt) {
      throw new NotFoundException('Message not found');
    }

    const membership = message.conversation.members[0];
    if (!membership) {
      throw new ForbiddenException('Not a member of this conversation');
    }

    // Find and delete reaction
    const reaction = await this.prisma.messageReaction.findUnique({
      where: {
        messageId_userId_emoji: { messageId, userId, emoji },
      },
    });

    if (!reaction) {
      throw new NotFoundException('Reaction not found');
    }

    await this.prisma.messageReaction.delete({
      where: { id: reaction.id },
    });

    // Emit real-time event
    await this.emitReactionRemoved(messageId, userId, emoji);

    return { message: 'Reaction removed' };
  }

  async getReactions(messageId: string, userId: string) {
    // Verify message access
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      include: {
        conversation: {
          include: { members: { where: { userId, leftAt: null } } },
        },
      },
    });

    if (!message || message.deletedAt) {
      throw new NotFoundException('Message not found');
    }

    const membership = message.conversation.members[0];
    if (!membership) {
      throw new ForbiddenException('Not a member of this conversation');
    }

    const reactions = await this.prisma.messageReaction.findMany({
      where: { messageId },
      include: { user: { include: { profile: true } } },
      orderBy: { createdAt: 'asc' },
    });

    // Group by emoji and count
    const grouped = reactions.reduce((acc, r) => {
      if (!acc[r.emoji]) {
        acc[r.emoji] = { emoji: r.emoji, count: 0, users: [] };
      }
      acc[r.emoji].count++;
      acc[r.emoji].users.push({
        id: r.user.id,
        displayName: r.user.profile?.displayName,
        avatarUrl: r.user.profile?.avatarUrl,
      });
      return acc;
    }, {} as Record<string, { emoji: string; count: number; users: any[] }>);

    return Object.values(grouped);
  }

  async getUserReaction(messageId: string, userId: string) {
    const reaction = await this.prisma.messageReaction.findUnique({
      where: { messageId_userId_emoji: { messageId, userId, emoji: '' } }, // This won't work directly
    });

    // Better approach: find any reaction by user on this message
    const reactions = await this.prisma.messageReaction.findMany({
      where: { messageId, userId },
      select: { emoji: true },
    });

    return reactions.map(r => r.emoji);
  }

  private async emitReactionAdded(messageId: string, reaction: any) {
    const event = {
      type: 'reaction_added',
      payload: this.formatReaction(reaction),
      messageId,
    };
    await this.redis.publish(`conversation:${reaction.message.conversationId}`, JSON.stringify(event));
  }

  private async emitReactionRemoved(messageId: string, userId: string, emoji: string) {
    // We need conversationId - fetch it
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      select: { conversationId: true },
    });

    if (message) {
      const event = {
        type: 'reaction_removed',
        payload: { messageId, userId, emoji },
      };
      await this.redis.publish(`conversation:${message.conversationId}`, JSON.stringify(event));
    }
  }

  private formatReaction(reaction: any) {
    return {
      id: reaction.id,
      messageId: reaction.messageId,
      userId: reaction.userId,
      emoji: reaction.emoji,
      createdAt: reaction.createdAt,
      user: reaction.user ? {
        id: reaction.user.id,
        displayName: reaction.user.profile?.displayName,
        avatarUrl: reaction.user.profile?.avatarUrl,
      } : undefined,
    };
  }
}