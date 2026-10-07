import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@shared/database/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user || user.deletedAt) {
      throw new NotFoundException('User not found');
    }

    const { ...safeUser } = user;
    return safeUser;
  }

  async findByPhoneNumber(phoneNumber: string) {
    return this.prisma.user.findUnique({
      where: { phoneNumber },
    });
  }

  async searchUsers(query: string, currentUserId: string, limit = 20) {
    return this.prisma.user.findMany({
      where: {
        AND: [
          { id: { not: currentUserId } },
          { deletedAt: null },
          { isVerified: true },
          {
            OR: [
              { phoneNumber: { contains: query, mode: 'insensitive' } },
              { profile: { displayName: { contains: query, mode: 'insensitive' } } },
            ],
          },
        ],
      },
      include: { profile: true },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getUserProfile(userId: string, requesterId: string) {
    const user = await this.findById(userId);
    const profile = user.profile;

    if (!profile) {
      return { user, profile: null, canView: false };
    }

    // Check privacy settings
    const canView = await this.canViewProfile(profile, userId, requesterId);

    return {
      user: { id: user.id, phoneNumber: user.phoneNumber, isVerified: user.isVerified },
      profile: canView ? profile : this.filterProfileByPrivacy(profile, userId, requesterId),
      canView,
    };
  }

  private async canViewProfile(profile: any, targetUserId: string, requesterId: string): Promise<boolean> {
    if (targetUserId === requesterId) return true;

    // Check if blocked
    const blocked = await this.prisma.blockedUser.findFirst({
      where: {
        OR: [
          { blockerId: requesterId, blockedId: targetUserId },
          { blockerId: targetUserId, blockedId: requesterId },
        ],
      },
    });

    if (blocked) return false;

    return true;
  }

  private filterProfileByPrivacy(profile: any, targetUserId: string, requesterId: string) {
    // This would check privacy settings from PrivacyService
    // For now, return minimal info
    return {
      displayName: profile.displayName,
      avatarUrl: profile.avatarUrl,
    };
  }

  async updateLastSeen(userId: string) {
    await this.prisma.userProfile.update({
      where: { userId },
      data: { updatedAt: new Date() },
    });
  }
}