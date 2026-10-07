import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shared/database/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async searchUsers(query: string, currentUserId: string, limit = 20) {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const searchTerm = query.trim();

    const users = await this.prisma.user.findMany({
      where: {
        AND: [
          { id: { not: currentUserId } },
          { deletedAt: null },
          { isVerified: true },
          {
            OR: [
              { phoneNumber: { contains: searchTerm, mode: 'insensitive' } },
              { profile: { displayName: { contains: searchTerm, mode: 'insensitive' } } },
            ],
          },
        ],
      },
      include: {
        profile: {
          select: {
            displayName: true,
            avatarUrl: true,
            about: true,
            privacyProfilePhoto: true,
            privacyAbout: true,
          },
        },
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    return users.map(u => ({
      id: u.id,
      phoneNumber: u.phoneNumber,
      displayName: u.profile?.displayName,
      avatarUrl: u.profile?.avatarUrl,
      about: u.profile?.about,
      isVerified: u.isVerified,
    }));
  }

  async searchConversations(query: string, userId: string, limit = 20) {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const searchTerm = query.trim();

    const conversations = await this.prisma.conversation.findMany({
      where: {
        deletedAt: null,
        members: {
          some: {
            userId,
            leftAt: null,
          },
        },
        OR: [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          {
            messages: {
              some: {
                content: { contains: searchTerm, mode: 'insensitive' },
                deletedAt: null,
              },
            },
          },
        ],
      },
      include: {
        members: {
          where: { userId: { not: userId }, leftAt: null },
          include: { user: { include: { profile: true } } },
          take: 10,
        },
        group: true,
        _count: { select: { messages: true } },
      },
      take: limit,
      orderBy: { updatedAt: 'desc' },
    });

    return conversations.map(c => this.enrichConversation(c, userId));
  }

  async searchMessages(query: string, userId: string, conversationId?: string, limit = 20) {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const searchTerm = query.trim();

    const where: Prisma.MessageWhereInput = {
      deletedAt: null,
      content: { contains: searchTerm, mode: 'insensitive' },
    };

    if (conversationId) {
      where.conversationId = conversationId;
    } else {
      where.conversation = {
        members: { some: { userId, leftAt: null } },
      };
    }

    const messages = await this.prisma.message.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        sender: { include: { profile: true } },
        conversation: {
          include: {
            members: {
              where: { userId: { not: userId }, leftAt: null },
              include: { user: { include: { profile: true } } },
              take: 5,
            },
          },
        },
      },
    });

    return messages.map(m => this.formatMessage(m));
  }

  private enrichConversation(conversation: any, userId: string) {
    const membership = conversation.members.find((m: any) => m.userId === userId);
    const otherMembers = conversation.members.filter((m: any) => m.userId !== userId);

    let displayName = conversation.name;
    let displayAvatar = conversation.avatarUrl;

    if (conversation.type === 'DIRECT' && otherMembers.length > 0) {
      const other = otherMembers[0];
      displayName = other.user.profile?.displayName || 'Unknown';
      displayAvatar = other.user.profile?.avatarUrl;
    }

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
      members: otherMembers.map((m: any) => ({
        id: m.id,
        userId: m.userId,
        displayName: m.user.profile?.displayName || 'Unknown',
        avatarUrl: m.user.profile?.avatarUrl,
        role: m.role,
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
      editedAt: message.editedAt,
      isDeleted: message.deletedAt !== null,
      deletedForEveryone: message.deletedForEveryone,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
      sender: message.sender ? {
        id: message.sender.id,
        displayName: message.sender.profile?.displayName,
        avatarUrl: message.sender.profile?.avatarUrl,
      } : undefined,
      conversation: message.conversation ? {
        id: message.conversation.id,
        type: message.conversation.type,
        name: message.conversation.name,
      } : undefined,
    };
  }
}