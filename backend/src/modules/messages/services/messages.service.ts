import { Injectable, NotFoundException, ForbiddenException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@shared/database/prisma.service';
import { RedisService } from '@shared/database/redis.service';
import { Prisma, MessageType, MessageStatus, GroupRole } from '@prisma/client';

import { SendMessageDto } from '../dto/send-message.dto';
import { UpdateMessageDto } from '../dto/update-message.dto';
import { MessageQueryDto } from '../dto/message-query.dto';

@Injectable()
export class MessagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async sendMessage(conversationId: string, senderId: string, dto: SendMessageDto) {
    // Check conversation exists and user is member
    const membership = await this.prisma.conversationMember.findUnique({
      where: { conversationId_userId: { conversationId, userId: senderId } },
    });

    if (!membership || membership.leftAt) {
      throw new NotFoundException('Conversation not found');
    }

    // Check for duplicate client_message_id
    const existingMessage = await this.prisma.message.findFirst({
      where: {
        conversationId,
        senderId,
        clientMessageId: dto.clientMessageId,
      },
    });

    if (existingMessage) {
      return this.formatMessage(existingMessage);
    }

    // Check if replying to a valid message
    if (dto.replyToId) {
      const replyTo = await this.prisma.message.findUnique({
        where: { id: dto.replyToId },
      });
      if (!replyTo || replyTo.conversationId !== conversationId || replyTo.deletedAt) {
        throw new BadRequestException('Invalid reply target');
      }
    }

    // Create message
    const message = await this.prisma.message.create({
      data: {
        conversationId,
        senderId,
        clientMessageId: dto.clientMessageId,
        type: MessageType.TEXT,
        content: dto.content?.trim() || '',
        status: MessageStatus.SENT,
        replyToId: dto.replyToId,
      },
      include: {
        sender: { include: { profile: true } },
        replyTo: { include: { sender: { include: { profile: true } } } },
      },
    });

    // Update conversation's last message
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: {
        updatedAt: new Date(),
        lastMessageId: message.id,
      },
    });

    // Increment unread count for other members
    await this.prisma.conversationMember.updateMany({
      where: {
        conversationId,
        userId: { not: senderId },
        leftAt: null,
      },
      data: {
        unreadCount: { increment: 1 },
      },
    });

    // Emit real-time event
    await this.emitNewMessage(message);

    return this.formatMessage(message);
  }

  async getMessages(conversationId: string, userId: string, query: MessageQueryDto) {
    const membership = await this.prisma.conversationMember.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });

    if (!membership || membership.leftAt) {
      throw new NotFoundException('Conversation not found');
    }

    const { page = 1, limit = 50, before, after, sortBy = 'createdAt', sortOrder = 'desc' } = query;

    const where: Prisma.MessageWhereInput = {
      conversationId,
      deletedAt: null,
    };

    if (before) {
      where.createdAt = { lt: new Date(before) };
    }
    if (after) {
      where.createdAt = { gt: new Date(after) };
    }

    const orderBy: Prisma.MessageOrderByWithRelationInput = {};
    orderBy[sortBy] = sortOrder;

    const messages = await this.prisma.message.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        sender: { include: { profile: true } },
        replyTo: { include: { sender: { include: { profile: true } } } },
        attachments: true,
        reactions: { include: { user: { include: { profile: true } } } },
        readReceipts: true,
      },
    });

    const total = await this.prisma.message.count({ where });

    return {
      data: messages.map(m => this.formatMessage(m)),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getMessage(messageId: string, userId: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      include: {
        sender: { include: { profile: true } },
        replyTo: { include: { sender: { include: { profile: true } } } },
        attachments: true,
        reactions: { include: { user: { include: { profile: true } } } },
        readReceipts: true,
      },
    });

    if (!message || message.deletedAt) {
      throw new NotFoundException('Message not found');
    }

    // Verify user has access to conversation
    const membership = await this.prisma.conversationMember.findUnique({
      where: { conversationId_userId: { conversationId: message.conversationId, userId } },
    });

    if (!membership || membership.leftAt) {
      throw new ForbiddenException('Access denied');
    }

    return this.formatMessage(message);
  }

  async updateMessage(messageId: string, userId: string, dto: UpdateMessageDto) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message || message.deletedAt) {
      throw new NotFoundException('Message not found');
    }

    if (message.senderId !== userId) {
      throw new ForbiddenException('Can only edit your own messages');
    }

    // Check edit time limit (15 minutes)
    const editWindow = 15 * 60 * 1000;
    if (Date.now() - message.createdAt.getTime() > editWindow) {
      throw new BadRequestException('Edit time limit exceeded');
    }

    const updated = await this.prisma.message.update({
      where: { id: messageId },
      data: {
        content: dto.content.trim(),
        editedAt: new Date(),
      },
      include: {
        sender: { include: { profile: true } },
        replyTo: { include: { sender: { include: { profile: true } } } },
        attachments: true,
      },
    });

    // Emit update event
    await this.emitMessageUpdated(updated);

    return this.formatMessage(updated);
  }

  async deleteMessage(messageId: string, userId: string, forEveryone = false) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      include: { conversation: { include: { members: true } } },
    });

    if (!message || message.deletedAt) {
      throw new NotFoundException('Message not found');
    }

    const membership = message.conversation.members.find(m => m.userId === userId && !m.leftAt);
    if (!membership) {
      throw new ForbiddenException('Not a member of this conversation');
    }

    if (forEveryone) {
      // Only sender or admin can delete for everyone
      if (message.senderId !== userId && membership.role !== GroupRole.ADMIN && membership.role !== GroupRole.OWNER) {
        throw new ForbiddenException('Cannot delete this message for everyone');
      }

      // Time limit for delete for everyone (1 hour)
      const deleteWindow = 60 * 60 * 1000;
      if (Date.now() - message.createdAt.getTime() > deleteWindow) {
        throw new BadRequestException('Delete for everyone time limit exceeded');
      }

      await this.prisma.message.update({
        where: { id: messageId },
        data: { deletedAt: new Date(), deletedForEveryone: true, content: '' },
      });

      await this.emitMessageDeleted(messageId, true);
    } else {
      // Delete for me
      await this.prisma.message.update({
        where: { id: messageId },
        data: { deletedAt: new Date() },
      });

      await this.emitMessageDeleted(messageId, false);
    }

    return { message: 'Message deleted' };
  }

  async searchMessages(userId: string, query: string, conversationId?: string, limit = 20) {
    const where: Prisma.MessageWhereInput = {
      deletedAt: null,
      content: { contains: query, mode: 'insensitive' },
    };

    if (conversationId) {
      where.conversationId = conversationId;
    } else {
      // Only search in conversations user is a member of
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
        conversation: true,
      },
    });

    return messages.map(m => this.formatMessage(m));
  }

  private async emitNewMessage(message: any) {
    const event = {
      type: 'new_message',
      payload: this.formatMessage(message),
      conversationId: message.conversationId,
    };
    await this.redis.publish(`conversation:${message.conversationId}`, JSON.stringify(event));
  }

  private async emitMessageUpdated(message: any) {
    const event = {
      type: 'message_updated',
      payload: this.formatMessage(message),
      conversationId: message.conversationId,
    };
    await this.redis.publish(`conversation:${message.conversationId}`, JSON.stringify(event));
  }

  private async emitMessageDeleted(messageId: string, forEveryone: boolean) {
    const event = {
      type: 'message_deleted',
      payload: { messageId, forEveryone },
    };
    // We need conversationId - fetch it
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      select: { conversationId: true },
    });
    if (message) {
      await this.redis.publish(`conversation:${message.conversationId}`, JSON.stringify(event));
    }
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
      replyTo: message.replyTo ? {
        id: message.replyTo.id,
        content: message.replyTo.content,
        senderId: message.replyTo.senderId,
        sender: message.replyTo.sender ? {
          id: message.replyTo.sender.id,
          displayName: message.replyTo.sender.profile?.displayName,
        } : undefined,
      } : undefined,
      attachments: message.attachments?.map((a: any) => ({
        id: a.id,
        type: a.type,
        url: a.url,
        thumbnailUrl: a.thumbnailUrl,
        fileName: a.fileName,
        mimeType: a.mimeType,
        fileSize: a.fileSize,
        width: a.width,
        height: a.height,
        duration: a.duration,
      })) || [],
      reactions: message.reactions?.map((r: any) => ({
        id: r.id,
        emoji: r.emoji,
        userId: r.userId,
        user: r.user ? { id: r.user.id, displayName: r.user.profile?.displayName } : undefined,
      })) || [],
      readReceipts: message.readReceipts?.map((r: any) => ({
        userId: r.userId,
        readAt: r.readAt,
      })) || [],
    };
  }
}