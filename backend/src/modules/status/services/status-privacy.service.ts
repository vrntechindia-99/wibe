import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shared/database/prisma.service';
import { Prisma, PrivacyLevel } from '@prisma/client';

@Injectable()
export class StatusPrivacyService {
  constructor(private readonly prisma: PrismaService) {}

  async canViewStatus(status: any, requesterId: string): Promise<boolean> {
    // Owner can always view
    if (status.userId === requesterId) {
      return true;
    }

    // Check if requester is blocked by status owner
    const blocked = await this.prisma.blockedUser.findFirst({
      where: {
        OR: [
          { blockerId: status.userId, blockedId: requesterId },
          { blockerId: requesterId, blockedId: status.userId },
        ],
      },
    });

    if (blocked) {
      return false;
    }

    // Check privacy settings
    switch (status.privacy) {
      case PrivacyLevel.EVERYONE:
        return true;

      case PrivacyLevel.CONTACTS:
        return this.areContacts(status.userId, requesterId);

      case PrivacyLevel.CONTACTS_EXCEPT:
        return this.areContacts(status.userId, requesterId) &&
          !(await this.isPrivacyException(status.userId, requesterId));

      case PrivacyLevel.SELECTED:
        return status.selectedUsers?.includes(requesterId) ?? false;

      case PrivacyLevel.NONE:
        return false;

      default:
        return false;
    }
  }

  private async areContacts(userId1: string, userId2: string): Promise<boolean> {
    const conversation = await this.prisma.conversation.findFirst({
      where: {
        type: 'DIRECT',
        members: {
          every: { userId: { in: [userId1, userId2] }, leftAt: null },
        },
      },
    });

    return !!conversation;
  }

  private async isPrivacyException(targetUserId: string, requesterId: string): Promise<boolean> {
    // Check if requester is in target's "contacts except" list
    // This would require a separate privacy_exceptions table
    // For now, return false
    return false;
  }
}