import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@shared/database/prisma.service';
import { RedisService } from '@shared/database/redis.service';
import { Prisma, MessageType, MessageStatus } from '@prisma/client';

import { ForwardMessageDto } from '../dto/forward-message.dto';

@Injectable()
export class ForwardingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async forwardMessage(messageId: string, userId: string, dto: ForwardMessageDto) {
    // Get original message with attachments
    const originalMessage = await this.prisma.message.findUnique({
      where: { id: messageId },
      include: {
        conversation: {
          include: { members: { where: { userId, leftAt: null } } },
        },
        attachments: true,
      },
    });

    if (!originalMessage || originalMessage.deletedAt) {
      throw new NotFoundException('Message not found');
    }

    // Verify user has access to source message
    const sourceMembership = originalMessage.conversation.members.find(
      m => m.userId === userId && !m.leftAt,
    );
    if (!sourceMembership) {
      throw new ForbiddenException('Not a member of the source conversation');
    }

    // Verify destination conversations
    if (!dto.conversationIds || dto.conversationIds.length === 0) {
      throw new BadRequestException('At least one destination conversation required');
    }

    // Check each destination conversation
    const destConversations = await this.prisma.conversation.findMany({
      where: { id: { in: dto.conversationIds } },
      include: { members: { where: { userId, leftAt: null } } },
    });

    if (destConversations.length !== dto.conversationIds.length) {
      throw new NotFoundException('One or more destination conversations not found');
    }

    // Verify user is member of all destination conversations
    for (const conv of destConversations) {
      const membership = conv.members.find(m => m.userId === userId && !m.leftAt);
      if (!membership) {
        throw new ForbiddenException(`Not a member of conversation ${conv.id}`);
      }
    }

    // Forward to each conversation
    const forwardedMessages = await this.prisma.$transaction(async (tx) => {
      const results = [];

      for (const convId of dto.conversationIds) {
        // Create forwarded message
        const forwardedMessage = await tx.message.create({
          data: {
            conversationId: convId,
            senderId: userId,
            clientMessageId: `forward-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: originalMessage.type,
            content: dto.caption || originalMessage.content,
            status: MessageStatus.SENT,
            replyToId: originalMessage.replyToId, // Preserve reply chain
            attachments: {
              create: originalMessage.attachments.map(att => ({
                type: att.type,
                url: att.url,
                thumbnailUrl: att.thumbnailUrl,
                fileName: att.fileName,
                mimeType: att.mimeType,
                fileSize: att.fileSize,
                width: att.width,
                height: att.height,
                duration: att.duration,
              })),
            },
          },
          include: { attachments: true },
        });

        // Record the forward relationship
        await tx.messageForward.create({
          data: {
            originalMessageId: messageId,
            forwardedMessageId: forwardedMessage.id,
            forwardedById: userId,
          },
        });

        // Update destination conversation
        await tx.conversation.update({
          where: { id: convId },
          data: { updatedAt: new Date(), lastMessageId: forwardedMessage.id },
        });

        // Increment unread for other members
        await tx.conversationMember.updateMany({
          where: { conversationId: convId, userId: { not: userId }, leftAt: null },
          data: { unreadCount: { increment: 1 } },
        });

        results.push({ conversationId: convId, message: forwardedMessage });
      }

      return results;
    });

    // Emit real-time events for each destination
    for (const result of forwardedMessages) {
      await this.emitNewMessage(result.conversationId, result.message);
    }

    return { forwarded: forwardedMessages.length };
  }

  private async emitNewMessage(conversationId: string, message: any) {
    const event = {
      type: 'new_message',
      payload: this.formatMessage(message),
      conversationId,
    };
    await this.redis.publish(`conversation:${conversationId}`, JSON.stringify(event));
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
      deletedForEveryone: message.deletedForEveryone,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
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
    };
  }
}