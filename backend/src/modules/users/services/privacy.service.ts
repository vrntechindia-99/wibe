import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@shared/database/prisma.service';

import { UpdatePrivacyDto } from '../dto/update-privacy.dto';
import { PrivacyLevel } from '@prisma/client';

@Injectable()
export class PrivacyService {
  constructor(private readonly prisma: PrismaService) {}

  async getPrivacySettings(userId: string) {
    const profile = await this.prisma.userProfile.findUnique({
      where: { userId },
      select: {
        privacyLastSeen: true,
        privacyProfilePhoto: true,
        privacyAbout: true,
        privacyReadReceipts: true,
        privacyStatus: true,
        privacyGroups: true,
      },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    return profile;
  }

  async updatePrivacySettings(userId: string, dto: UpdatePrivacyDto) {
    const profile = await this.prisma.userProfile.update({
      where: { userId },
      data: {
        privacyLastSeen: dto.lastSeen,
        privacyProfilePhoto: dto.profilePhoto,
        privacyAbout: dto.about,
        privacyReadReceipts: dto.readReceipts,
        privacyStatus: dto.status,
        privacyGroups: dto.groups,
      },
    });

    return {
      lastSeen: profile.privacyLastSeen,
      profilePhoto: profile.privacyProfilePhoto,
      about: profile.privacyAbout,
      readReceipts: profile.privacyReadReceipts,
      status: profile.privacyStatus,
      groups: profile.privacyGroups,
    };
  }

  async canViewLastSeen(targetUserId: string, requesterId: string): Promise<boolean> {
    if (targetUserId === requesterId) return true;

    const profile = await this.prisma.userProfile.findUnique({
      where: { userId: targetUserId },
      select: { privacyLastSeen: true },
    });

    if (!profile) return false;

    return this.checkPrivacyLevel(profile.privacyLastSeen, targetUserId, requesterId);
  }

  async canViewProfilePhoto(targetUserId: string, requesterId: string): Promise<boolean> {
    if (targetUserId === requesterId) return true;

    const profile = await this.prisma.userProfile.findUnique({
      where: { userId: targetUserId },
      select: { privacyProfilePhoto: true },
    });

    if (!profile) return false;

    return this.checkPrivacyLevel(profile.privacyProfilePhoto, targetUserId, requesterId);
  }

  async canViewAbout(targetUserId: string, requesterId: string): Promise<boolean> {
    if (targetUserId === requesterId) return true;

    const profile = await this.prisma.userProfile.findUnique({
      where: { userId: targetUserId },
      select: { privacyAbout: true },
    });

    if (!profile) return false;

    return this.checkPrivacyLevel(profile.privacyAbout, targetUserId, requesterId);
  }

  async canViewStatus(targetUserId: string, requesterId: string): Promise<boolean> {
    if (targetUserId === requesterId) return true;

    const profile = await this.prisma.userProfile.findUnique({
      where: { userId: targetUserId },
      select: { privacyStatus: true },
    });

    if (!profile) return false;

    return this.checkPrivacyLevel(profile.privacyStatus, targetUserId, requesterId);
  }

  async canViewReadReceipts(targetUserId: string): Promise<boolean> {
    const profile = await this.prisma.userProfile.findUnique({
      where: { userId: targetUserId },
      select: { privacyReadReceipts: true },
    });

    return profile?.privacyReadReceipts ?? true;
  }

  async canAddToGroup(targetUserId: string, requesterId: string): Promise<boolean> {
    if (targetUserId === requesterId) return true;

    const profile = await this.prisma.userProfile.findUnique({
      where: { userId: targetUserId },
      select: { privacyGroups: true },
    });

    if (!profile) return false;

    return this.checkPrivacyLevel(profile.privacyGroups, targetUserId, requesterId);
  }

  private async checkPrivacyLevel(level: PrivacyLevel, targetUserId: string, requesterId: string): Promise<boolean> {
    switch (level) {
      case PrivacyLevel.EVERYONE:
        return true;
      case PrivacyLevel.NONE:
        return false;
      case PrivacyLevel.CONTACTS:
        return this.areContacts(targetUserId, requesterId);
      case PrivacyLevel.CONTACTS_EXCEPT:
        return this.areContacts(targetUserId, requesterId) && !(await this.isExcepted(targetUserId, requesterId));
      case PrivacyLevel.SELECTED:
        return this.isSelected(targetUserId, requesterId);
      default:
        return false;
    }
  }

  private async areContacts(userId1: string, userId2: string): Promise<boolean> {
    // Check if they have a direct conversation
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

    return !!conversation;
  }

  private async isExcepted(targetUserId: string, requesterId: string): Promise<boolean> {
    // Would check a separate "privacy exceptions" table
    // For now, return false
    return false;
  }

  private async isSelected(targetUserId: string, requesterId: string): Promise<boolean> {
    // Would check selected users from profile
    const profile = await this.prisma.userProfile.findUnique({
      where: { userId: targetUserId },
      select: { /* selectedUsers for privacy */ },
    });

    // Placeholder
    return false;
  }
}