import { Injectable, NotFoundException, ForbiddenException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@shared/database/prisma.service';
import { RedisService } from '@shared/database/redis.service';
import { ConversationType, GroupRole, MessageStatus, Prisma } from '@prisma/client';

import { CreateConversationDto } from '../dto/create-conversation.dto';
import { UpdateConversationDto } from '../dto/update-conversation.dto';
import { ConversationQueryDto, ConversationSortBy, SortOrder } from '../dto/conversation-query.dto';
import { MuteConversationDto } from '../dto/mute-conversation.dto';

@Injectable()
export class ConversationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async createDirectConversation(userId: string, dto: CreateConversationDto) {
    if (!dto.userId) {
      throw new BadRequestException('userId is required for direct conversation');
    }

    if (dto.userId === userId) {
      throw new BadRequestException('Cannot create conversation with yourself');
    }

    const targetUser = await this.prisma.user.findUnique({
      where: { id: dto.userId },
    });

    if (!targetUser || targetUser.deletedAt || !targetUser.isVerified) {
      throw new NotFoundException('User not found');
    }

    // Check if blocked
    const isBlocked = await this.prisma.blockedUser.findFirst({
      where: {
        OR: [
          { blockerId: userId, blockedId: dto.userId },
          { blockerId: dto.userId, blockedId: userId },
        ],
      },
    });

    if (isBlocked) {
      throw new ForbiddenException('Cannot create conversation');
    }

    // Check for existing direct conversation
    const existingConversation = await this.prisma.conversation.findFirst({
      where: {
        type: ConversationType.DIRECT,
        members: {
          every: {
            userId: { in: [userId, dto.userId] },
          },
        },
      },
      include: { members: true },
    });

    if (existingConversation) {
      // Check if user left and wants to rejoin
      const userMember = existingConversation.members.find(m => m.userId === userId);
      if (userMember?.leftAt) {
        await this.prisma.conversationMember.update({
          where: { id: userMember.id },
          data: { leftAt: null, joinedAt: new Date() },
        });
      }
      return this.getConversationForUser(existingConversation.id, userId);
    }

    // Create new direct conversation
    const conversation = await this.prisma.conversation.create({
      data: {
        type: ConversationType.DIRECT,
        createdBy: userId,
        members: {
          create: [
            { userId, role: GroupRole.MEMBER },
            { userId: dto.userId, role: GroupRole.MEMBER },
          ],
        },
      },
      include: { members: true },
    });

    return this.getConversationForUser(conversation.id, userId);
  }

  async createGroupConversation(userId: string, dto: CreateConversationDto) {
    if (!dto.name?.trim()) {
      throw new BadRequestException('Group name is required');
    }

    const memberIds = dto.userId ? [dto.userId] : [];
    const uniqueMemberIds = [...new Set([userId, ...memberIds])];

    if (uniqueMemberIds.length < 2) {
      throw new BadRequestException('Group must have at least 2 members');
    }

    if (uniqueMemberIds.length > 512) {
      throw new BadRequestException('Group cannot have more than 512 members');
    }

    // Verify all users exist and are not blocked
    const users = await this.prisma.user.findMany({
      where: { id: { in: uniqueMemberIds } },
    });

    if (users.length !== uniqueMemberIds.length) {
      throw new NotFoundException('One or more users not found');
    }

    for (const memberId of uniqueMemberIds.filter(id => id !== userId)) {
      const isBlocked = await this.prisma.blockedUser.findFirst({
        where: {
          OR: [
            { blockerId: userId, blockedId: memberId },
            { blockerId: memberId, blockedId: userId },
          ],
        },
      });
      if (isBlocked) {
        throw new ForbiddenException(`Cannot add blocked user: ${memberId}`);
      }
    }

    const conversation = await this.prisma.conversation.create({
      data: {
        type: ConversationType.GROUP,
        name: dto.name.trim(),
        description: dto.description?.trim(),
        createdBy: userId,
        members: {
          create: uniqueMemberIds.map(id => ({
            userId: id,
            role: id === userId ? GroupRole.OWNER : GroupRole.MEMBER,
            invitedBy: id === userId ? null : userId,
          })),
        },
        group: {
          create: {
            name: dto.name.trim(),
            description: dto.description?.trim(),
            createdBy: userId,
          },
        },
      },
      include: { members: true, group: true },
    });

    return this.getConversationForUser(conversation.id, userId);
  }

  async getConversations(userId: string, query: ConversationQueryDto) {
    const { page = 1, limit = 20, sortBy = ConversationSortBy.UPDATED_AT, sortOrder = SortOrder.DESC, includeArchived = false, search } = query;

    const where: Prisma.ConversationWhereInput = {
      members: {
        some: {
          userId,
          leftAt: null,
        },
      },
    };

    if (!includeArchived) {
      where.members = {
        some: {
          userId,
          leftAt: null,
          isArchived: false,
        },
      };
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { messages: { some: { content: { contains: search, mode: 'insensitive' } } } },
      ];
    }

    const orderBy: Prisma.ConversationOrderByWithRelationInput = {};
    orderBy[sortBy] = sortOrder;

    const [conversations, total] = await Promise.all([
      this.prisma.conversation.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          members: {
            where: { userId: { not: userId } },
            include: { user: { include: { profile: true } } },
            take: 10,
          },
          group: true,
          _count: { select: { members: true, messages: true } },
        },
      }),
      this.prisma.conversation.count({ where }),
    ]);

    const enriched = await Promise.all(
      conversations.map(c => this.enrichConversation(c, userId)),
    );

    return {
      data: enriched,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getConversation(conversationId: string, userId: string) {
    const membership = await this.prisma.conversationMember.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });

    if (!membership || membership.leftAt) {
      throw new NotFoundException('Conversation not found');
    }

    return this.getConversationForUser(conversationId, userId);
  }

  private async getConversationForUser(conversationId: string, userId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        members: {
          include: { user: { include: { profile: true } } },
        },
        group: true,
        _count: { select: { messages: true } },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    return this.enrichConversation(conversation, userId);
  }

  private async enrichConversation(conversation: any, userId: string) {
    const membership = conversation.members.find((m: any) => m.userId === userId);
    const otherMembers = conversation.members.filter((m: any) => m.userId !== userId);

    let displayName = conversation.name;
    let displayAvatar = conversation.avatarUrl;

    if (conversation.type === ConversationType.DIRECT && otherMembers.length > 0) {
      const other = otherMembers[0];
      displayName = other.user.profile?.displayName || 'Unknown';
      displayAvatar = other.user.profile?.avatarUrl;
    }

    const lastMessage = await this.prisma.message.findFirst({
      where: { conversationId: conversation.id, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: { sender: { include: { profile: true } } },
    });

    return {
      id: conversation.id,
      type: conversation.type,
      name: displayName,
      avatarUrl: displayAvatar,
      isPinned: membership?.isPinned || false,
      isArchived: membership?.isArchived || false,
      isMuted: membership?.isMuted || false,
      muteUntil: membership?.muteUntil,
      unreadCount: membership?.unreadCount || 0,
      lastMessage: lastMessage ? this.formatMessage(lastMessage) : null,
      members: otherMembers.map((m: any) => ({
        id: m.id,
        userId: m.userId,
        displayName: m.user.profile?.displayName || 'Unknown',
        avatarUrl: m.user.profile?.avatarUrl,
        role: m.role,
        isOnline: false, // Will be populated by presence service
        lastSeen: m.user.profile?.updatedAt,
      })),
      group: conversation.group,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
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
      replyToId: message.replyToId,
      isEdited: message.editedAt !== null,
      isDeleted: message.deletedAt !== null,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
      sender: message.sender ? {
        id: message.sender.id,
        displayName: message.sender.profile?.displayName,
        avatarUrl: message.sender.profile?.avatarUrl,
      } : undefined,
    };
  }

  async updateConversation(conversationId: string, userId: string, dto: UpdateConversationDto) {
    const membership = await this.getMembershipOrThrow(conversationId, userId, [GroupRole.ADMIN, GroupRole.OWNER]);

    const conversation = await this.prisma.conversation.update({
      where: { id: conversationId },
      data: {
        name: dto.name,
        description: dto.description,
        avatarUrl: dto.avatarUrl,
      },
    });

    return this.getConversationForUser(conversationId, userId);
  }

  async pinConversation(conversationId: string, userId: string) {
    await this.getMembershipOrThrow(conversationId, userId);

    await this.prisma.conversationMember.update({
      where: { conversationId_userId: { conversationId, userId } },
      data: { isPinned: true },
    });

    return { message: 'Conversation pinned' };
  }

  async unpinConversation(conversationId: string, userId: string) {
    await this.getMembershipOrThrow(conversationId, userId);

    await this.prisma.conversationMember.update({
      where: { conversationId_userId: { conversationId, userId } },
      data: { isPinned: false },
    });

    return { message: 'Conversation unpinned' };
  }

  async muteConversation(conversationId: string, userId: string, dto: MuteConversationDto) {
    await this.getMembershipOrThrow(conversationId, userId);

    const muteUntil = dto.duration ? new Date(Date.now() + dto.duration * 1000) : null;

    await this.prisma.conversationMember.update({
      where: { conversationId_userId: { conversationId, userId } },
      data: { isMuted: true, muteUntil },
    });

    return { message: 'Conversation muted' };
  }

  async unmuteConversation(conversationId: string, userId: string) {
    await this.getMembershipOrThrow(conversationId, userId);

    await this.prisma.conversationMember.update({
      where: { conversationId_userId: { conversationId, userId } },
      data: { isMuted: false, muteUntil: null },
    });

    return { message: 'Conversation unmuted' };
  }

  async archiveConversation(conversationId: string, userId: string) {
    await this.getMembershipOrThrow(conversationId, userId);

    await this.prisma.conversationMember.update({
      where: { conversationId_userId: { conversationId, userId } },
      data: { isArchived: true },
    });

    return { message: 'Conversation archived' };
  }

  async unarchiveConversation(conversationId: string, userId: string) {
    await this.getMembershipOrThrow(conversationId, userId);

    await this.prisma.conversationMember.update({
      where: { conversationId_userId: { conversationId, userId } },
      data: { isArchived: false },
    });

    return { message: 'Conversation unarchived' };
  }

  async markUnread(conversationId: string, userId: string) {
    const membership = await this.getMembershipOrThrow(conversationId, userId);

    if (!membership.lastReadMessageId) {
      return { message: 'Already unread' };
    }

    await this.prisma.conversationMember.update({
      where: { conversationId_userId: { conversationId, userId } },
      data: { lastReadMessageId: null, unreadCount: 0 },
    });

    return { message: 'Conversation marked unread' };
  }

  async deleteConversation(conversationId: string, userId: string, forEveryone = false) {
    const membership = await this.getMembershipOrThrow(conversationId, userId);

    if (forEveryone) {
      // Only group owner or admin can delete for everyone
      if (membership.role !== GroupRole.OWNER && membership.role !== GroupRole.ADMIN) {
        throw new ForbiddenException('Only admins can delete conversation for everyone');
      }
      // Soft delete
      await this.prisma.conversation.update({
        where: { id: conversationId },
        data: { deletedAt: new Date() },
      });
      // Update all members
      await this.prisma.conversationMember.updateMany({
        where: { conversationId },
        data: { leftAt: new Date() },
      });
    } else {
      // Delete for me only
      await this.prisma.conversationMember.update({
        where: { conversationId_userId: { conversationId, userId } },
        data: { leftAt: new Date() },
      });
    }

    return { message: 'Conversation deleted' };
  }

  async markAsRead(conversationId: string, userId: string, messageId?: string) {
    const membership = await this.getMembershipOrThrow(conversationId, userId);

    if (!messageId) {
      // Get latest message
      const lastMessage = await this.prisma.message.findFirst({
        where: { conversationId, deletedAt: null },
        orderBy: { createdAt: 'desc' },
        select: { id: true },
      });
      if (!lastMessage) return { message: 'No messages to mark as read' };
      messageId = lastMessage.id;
    }

    await this.prisma.conversationMember.update({
      where: { conversationId_userId: { conversationId, userId } },
      data: { lastReadMessageId: messageId, unreadCount: 0 },
    });

    // Create read receipt
    await this.prisma.messageReadReceipt.upsert({
      where: { messageId_userId: { messageId, userId } },
      create: { messageId, userId },
      update: { readAt: new Date() },
    });

    // Emit read event via WebSocket
    await this.redis.publish(`conversation:${conversationId}:read`, JSON.stringify({
      messageId,
      userId,
      conversationId,
    }));

    return { message: 'Messages marked as read' };
  }

  async markAsDelivered(conversationId: string, userId: string, messageId: string) {
    await this.getMembershipOrThrow(conversationId, userId);

    await this.prisma.message.update({
      where: { id: messageId },
      data: { status: MessageStatus.DELIVERED },
    });

    // Emit delivered event
    await this.redis.publish(`conversation:${conversationId}:delivered`, JSON.stringify({
      messageId,
      userId,
      conversationId,
    }));

    return { message: 'Message marked as delivered' };
  }

  private async getMembershipOrThrow(
    conversationId: string,
    userId: string,
    requiredRoles?: GroupRole[],
  ) {
    const membership = await this.prisma.conversationMember.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });

    if (!membership || membership.leftAt) {
      throw new NotFoundException('Conversation not found');
    }

    if (requiredRoles && !requiredRoles.includes(membership.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return membership;
  }
}