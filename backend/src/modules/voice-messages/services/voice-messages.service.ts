import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@shared/database/prisma.service';
import { MediaService } from '@modules/media/services/media.service';
import { RedisService } from '@shared/database/redis.service';

@Injectable()
export class VoiceMessagesService {
  private readonly logger = new Logger(VoiceMessagesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mediaService: MediaService,
    private readonly redis: RedisService,
  ) {}

  async getVoiceMessage(messageId: string, userId: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      include: {
        attachments: true,
        conversation: {
          include: { members: true },
        },
      },
    });

    if (!message || message.deletedAt) {
      throw new NotFoundException('Voice message not found');
    }

    if (message.type !== 'AUDIO') {
      throw new BadRequestException('Message is not a voice message');
    }

    // Verify membership
    const membership = message.conversation.members.find(
      (m) => m.userId === userId && !m.leftAt,
    );
    if (!membership) {
      throw new ForbiddenException('Not a member of this conversation');
    }

    const attachment = message.attachments[0];
    if (!attachment) {
      throw new NotFoundException('Voice attachment not found');
    }

    const downloadUrl = await this.mediaService.getPresignedDownloadUrl(attachment.id, userId);

    return {
      id: message.id,
      clientMessageId: message.clientMessageId,
      conversationId: message.conversationId,
      senderId: message.senderId,
      duration: attachment.duration,
      waveform: attachment.waveform, // Stored as JSON array
      downloadUrl,
      status: message.status,
      createdAt: message.createdAt,
    };
  }

  async getVoiceMessagesInConversation(conversationId: string, userId: string) {
    const membership = await this.prisma.conversationMember.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });

    if (!membership || membership.leftAt) {
      throw new ForbiddenException('Not a member of this conversation');
    }

    const messages = await this.prisma.message.findMany({
      where: {
        conversationId,
        type: 'AUDIO',
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
      include: { attachments: true },
    });

    return messages.map((m) => ({
      id: m.id,
      clientMessageId: m.clientMessageId,
      senderId: m.senderId,
      duration: m.attachments[0]?.duration,
      waveform: m.attachments[0]?.waveform,
      status: m.status,
      createdAt: m.createdAt,
    }));
  }

  async deleteVoiceMessage(messageId: string, userId: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      include: { attachments: true },
    });

    if (!message || message.deletedAt) {
      throw new NotFoundException('Voice message not found');
    }

    if (message.senderId !== userId) {
      throw new ForbiddenException('Cannot delete another user\'s voice message');
    }

    // Delete attachment from storage
    if (message.attachments[0]) {
      await this.mediaService.deleteMedia(message.attachments[0].id, userId);
    }

    // Soft delete message
    await this.prisma.message.update({
      where: { id: messageId },
      data: { deletedAt: new Date(), deletedForEveryone: true },
    });

    return { message: 'Voice message deleted' };
  }

  // Waveform data is stored as JSON in the attachment record
  // Format: [12, 18, 25, 19, 31, 42, 27, ...] - normalized amplitude values
  async saveWaveformData(attachmentId: string, waveform: number[]) {
    await this.prisma.messageAttachment.update({
      where: { id: attachmentId },
      data: { waveform },
    });
  }
}