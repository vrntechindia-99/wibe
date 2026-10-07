import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '@shared/database/prisma.service';

@Injectable()
export class BlockService {
  constructor(private readonly prisma: PrismaService) {}

  async blockUser(blockerId: string, blockedId: string) {
    if (blockerId === blockedId) {
      throw new ConflictException('Cannot block yourself');
    }

    const blockedUser = await this.prisma.user.findUnique({
      where: { id: blockedId },
    });

    if (!blockedUser) {
      throw new NotFoundException('User not found');
    }

    // Check if already blocked
    const existing = await this.prisma.blockedUser.findUnique({
      where: { blockerId_blockedId: { blockerId, blockedId } },
    });

    if (existing) {
      throw new ConflictException('User already blocked');
    }

    // Create block
    await this.prisma.blockedUser.create({
      data: { blockerId, blockedId },
    });

    // Delete any direct conversation between them
    await this.deleteDirectConversation(blockerId, blockedId);

    return { message: 'User blocked successfully' };
  }

  async unblockUser(blockerId: string, blockedId: string) {
    const block = await this.prisma.blockedUser.findUnique({
      where: { blockerId_blockedId: { blockerId, blockedId } },
    });

    if (!block) {
      throw new NotFoundException('Block not found');
    }

    await this.prisma.blockedUser.delete({
      where: { blockerId_blockedId: { blockerId, blockedId } },
    });

    return { message: 'User unblocked successfully' };
  }

  async getBlockedUsers(userId: string) {
    return this.prisma.blockedUser.findMany({
      where: { blockerId: userId },
      include: {
        blocked: {
          include: { profile: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async isBlocked(blockerId: string, blockedId: string): Promise<boolean> {
    const block = await this.prisma.blockedUser.findUnique({
      where: { blockerId_blockedId: { blockerId, blockedId } },
    });

    return !!block;
  }

  async isBlockedEitherWay(userId1: string, userId2: string): Promise<boolean> {
    const block = await this.prisma.blockedUser.findFirst({
      where: {
        OR: [
          { blockerId: userId1, blockedId: userId2 },
          { blockerId: userId2, blockedId: userId1 },
        ],
      },
    });

    return !!block;
  }

  private async deleteDirectConversation(userId1: string, userId2: string) {
    const conversation = await this.prisma.conversation.findFirst({
      where: {
        type: 'DIRECT',
        members: {
          every: {
            userId: { in: [userId1, userId2] },
          },
        },
      },
    });

    if (conversation) {
      // Soft delete - mark as deleted for both users
      await this.prisma.conversationMember.updateMany({
        where: { conversationId: conversation.id, userId: { in: [userId1, userId2] } },
        data: { leftAt: new Date() },
      });
    }
  }
}