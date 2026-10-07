import { Injectable, NotFoundException, ForbiddenException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '@shared/database/prisma.service';
import { RedisService } from '@shared/database/redis.service';
import { MediaService } from '@modules/media/services/media.service';
import { ConversationType, GroupRole, Prisma } from '@prisma/client';

import { CreateGroupDto } from '../dto/create-group.dto';
import { UpdateGroupDto } from '../dto/update-group.dto';
import { GroupSettingsDto } from '../dto/group-settings.dto';
import { GroupQueryDto, GroupSortBy, SortOrder } from '../dto/group-query.dto';

@Injectable()
export class GroupsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly mediaService: MediaService,
  ) {}

  async createGroup(creatorId: string, dto: CreateGroupDto) {
    // Validate members
    const uniqueMemberIds = [...new Set([creatorId, ...dto.memberIds])];

    if (uniqueMemberIds.length < 2) {
      throw new BadRequestException('Group must have at least 2 members');
    }

    if (uniqueMemberIds.length > 500) {
      throw new BadRequestException('Group cannot have more than 500 members');
    }

    // Verify all users exist and are not blocked
    const users = await this.prisma.user.findMany({
      where: { id: { in: uniqueMemberIds } },
    });

    if (users.length !== uniqueMemberIds.length) {
      throw new NotFoundException('One or more users not found');
    }

    // Check for blocks
    for (const memberId of dto.memberIds) {
      const isBlocked = await this.prisma.blockedUser.findFirst({
        where: {
          OR: [
            { blockerId: creatorId, blockedId: memberId },
            { blockerId: memberId, blockedId: creatorId },
          ],
        },
      });
      if (isBlocked) {
        throw new ForbiddenException(`Cannot add blocked user: ${memberId}`);
      }
    }

    // Create group in transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Create conversation
      const conversation = await tx.conversation.create({
        data: {
          type: ConversationType.GROUP,
          name: dto.name,
          description: dto.description,
          createdBy: creatorId,
          members: {
            create: uniqueMemberIds.map((userId) => ({
              userId,
              role: userId === creatorId ? GroupRole.OWNER : GroupRole.MEMBER,
              invitedBy: userId === creatorId ? null : creatorId,
            })),
          },
        },
        include: { members: true },
      });

      // Create group
      const group = await tx.group.create({
        data: {
          conversationId: conversation.id,
          name: dto.name,
          description: dto.description,
          createdBy: creatorId,
          settings: {},
          members: {
            create: uniqueMemberIds.map((userId) => ({
              userId,
              role: userId === creatorId ? GroupRole.OWNER : GroupRole.MEMBER,
              invitedBy: userId === creatorId ? null : creatorId,
            })),
          },
        },
      });

      return { conversation, group };
    });

    return this.getGroupForUser(result.conversation.id, creatorId);
  }

  async getUserGroups(userId: string, query: GroupQueryDto) {
    const { page = 1, limit = 20, sortBy = GroupSortBy.UPDATED_AT, sortOrder = SortOrder.DESC, search } = query;

    const where: Prisma.GroupWhereInput = {
      members: {
        some: {
          userId,
          leftAt: null,
        },
      },
      conversation: {
        deletedAt: null,
      },
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const orderBy: Prisma.GroupOrderByWithRelationInput = {};
    if (sortBy === GroupSortBy.MEMBER_COUNT) {
      // We'll handle this separately since it's a computed field
      orderBy.updatedAt = sortOrder;
    } else {
      orderBy[sortBy] = sortOrder;
    }

    const [groups, total] = await Promise.all([
      this.prisma.group.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          conversation: {
            include: {
              members: {
                where: { leftAt: null },
                include: { user: { include: { profile: true } } },
                take: 10,
              },
            },
          },
          members: {
            where: { leftAt: null },
            include: { user: { include: { profile: true } } },
          },
          _count: { select: { members: true } },
        },
      }),
      this.prisma.group.count({ where }),
    ]);

    const enriched = await Promise.all(
      groups.map((g) => this.enrichGroup(g, userId)),
    );

    // Sort by member count if requested (done in memory for small result sets)
    if (sortBy === GroupSortBy.MEMBER_COUNT) {
      enriched.sort((a, b) =>
        sortOrder === SortOrder.DESC
          ? b.memberCount - a.memberCount
          : a.memberCount - b.memberCount,
      );
    }

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

  async getGroup(groupId: string, userId: string) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      include: {
        conversation: {
          include: {
            members: {
              where: { leftAt: null },
              include: { user: { include: { profile: true } } },
              take: 10,
            },
          },
        },
        members: {
          where: { leftAt: null },
          include: { user: { include: { profile: true } } },
        },
        _count: { select: { members: true } },
      },
    });

    if (!group || group.conversation.deletedAt) {
      throw new NotFoundException('Group not found');
    }

    // Verify membership
    const membership = group.members.find((m) => m.userId === userId && !m.leftAt);
    if (!membership) {
      throw new ForbiddenException('Not a member of this group');
    }

    return this.enrichGroup(group, userId);
  }

  async updateGroup(groupId: string, userId: string, dto: UpdateGroupDto) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      include: { members: { where: { userId, leftAt: null } } },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    const membership = group.members[0];
    if (!membership || membership.role === GroupRole.MEMBER) {
      throw new ForbiddenException('Only admins can update group');
    }

    // Handle avatar upload
    let avatarUrl = dto.avatarUrl;
    if (avatarUrl && avatarUrl !== group.avatarUrl) {
      // Verify the avatar URL is valid (should be from our media service)
      // The media service handles the actual upload
    }

    const updated = await this.prisma.group.update({
      where: { id: groupId },
      data: {
        name: dto.name,
        description: dto.description,
        avatarUrl,
      },
      include: {
        conversation: true,
        members: { where: { leftAt: null } },
      },
    });

    // Update conversation name if changed
    if (dto.name && dto.name !== group.name) {
      await this.prisma.conversation.update({
        where: { id: group.conversationId },
        data: { name: dto.name },
      });
    }

    // Emit real-time event
    await this.emitGroupUpdated(groupId, updated);

    return this.enrichGroup(
      { ...updated, members: group.members },
      userId,
    );
  }

  async updateGroupSettings(groupId: string, userId: string, dto: GroupSettingsDto) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      include: { members: { where: { userId, leftAt: null } } },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    const membership = group.members[0];
    if (!membership || membership.role === GroupRole.MEMBER) {
      throw new ForbiddenException('Only admins can update settings');
    }

    const currentSettings = (group.settings as Record<string, any>) || {};
    const newSettings = { ...currentSettings, ...dto };

    await this.prisma.group.update({
      where: { id: groupId },
      data: { settings: newSettings },
    });

    await this.emitGroupUpdated(groupId, { ...group, settings: newSettings });

    return { message: 'Settings updated' };
  }

  async addMembers(groupId: string, userId: string, memberIds: string[]) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      include: {
        members: { where: { leftAt: null } },
        conversation: { include: { members: { where: { leftAt: null } } } },
      },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    const membership = group.members.find((m) => m.userId === userId && !m.leftAt);
    if (!membership) {
      throw new ForbiddenException('Not a member of this group');
    }

    // Check permission
    const settings = (group.settings as Record<string, any>) || {};
    const onlyAdminsCanAdd = settings.onlyAdminsCanAddMembers ?? false;
    if (onlyAdminsCanAdd && membership.role === GroupRole.MEMBER) {
      throw new ForbiddenException('Only admins can add members');
    }

    // Check max members
    const maxMembers = settings.maxMembers || 500;
    if (group.members.length + memberIds.length > maxMembers) {
      throw new BadRequestException(`Group would exceed max members (${maxMembers})`);
    }

    // Verify users exist
    const users = await this.prisma.user.findMany({
      where: { id: { in: memberIds } },
    });

    if (users.length !== memberIds.length) {
      throw new NotFoundException('One or more users not found');
    }

    // Check for existing members
    const existingMemberIds = group.members.map((m) => m.userId);
    const newMemberIds = memberIds.filter((id) => !existingMemberIds.includes(id));

    if (newMemberIds.length === 0) {
      throw new ConflictException('All users are already members');
    }

    // Check for blocks
    for (const memberId of newMemberIds) {
      for (const existingId of existingMemberIds) {
        const isBlocked = await this.prisma.blockedUser.findFirst({
          where: {
            OR: [
              { blockerId: existingId, blockedId: memberId },
              { blockerId: memberId, blockedId: existingId },
            ],
          },
        });
        if (isBlocked) {
          throw new ForbiddenException(`Cannot add user due to block: ${memberId}`);
        }
      }
    }

    // Add members in transaction
    await this.prisma.$transaction(async (tx) => {
      // Add to group members
      await tx.groupMember.createMany({
        data: newMemberIds.map((userId) => ({
          groupId,
          userId,
          role: GroupRole.MEMBER,
          invitedBy: userId,
        })),
        skipDuplicates: true,
      });

      // Add to conversation members
      await tx.conversationMember.createMany({
        data: newMemberIds.map((userId) => ({
          conversationId: group.conversationId,
          userId,
          role: GroupRole.MEMBER,
        })),
        skipDuplicates: true,
      });
    });

    // Emit member added events
    for (const newMemberId of newMemberIds) {
      await this.emitMemberAdded(groupId, newMemberId, userId);
    }

    return { message: `${newMemberIds.length} members added` };
  }

  async removeMember(groupId: string, userId: string, targetUserId: string) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      include: {
        members: { where: { leftAt: null } },
        conversation: { include: { members: { where: { leftAt: null } } } },
      },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    const requesterMembership = group.members.find((m) => m.userId === userId && !m.leftAt);
    if (!requesterMembership) {
      throw new ForbiddenException('Not a member of this group');
    }

    const targetMembership = group.members.find((m) => m.userId === targetUserId && !m.leftAt);
    if (!targetMembership) {
      throw new NotFoundException('Target user is not a member');
    }

    // Check permission
    const canRemove = this.canRemoveMember(requesterMembership, targetMembership);
    if (!canRemove) {
      throw new ForbiddenException('Cannot remove this member');
    }

    // Prevent removing the last admin
    if (targetMembership.role === GroupRole.ADMIN || targetMembership.role === GroupRole.OWNER) {
      const adminCount = group.members.filter(
        (m) => m.role === GroupRole.ADMIN || m.role === GroupRole.OWNER,
      ).length;
      if (adminCount <= 1) {
        throw new BadRequestException('Cannot remove the last admin');
      }
    }

    // Remove in transaction
    await this.prisma.$transaction(async (tx) => {
      // Soft delete group membership
      await tx.groupMember.update({
        where: { groupId_userId: { groupId, userId: targetUserId } },
        data: { leftAt: new Date() },
      });

      // Soft delete conversation membership
      await tx.conversationMember.update({
        where: { conversationId_userId: { conversationId: group.conversationId, userId: targetUserId } },
        data: { leftAt: new Date() },
      });
    });

    // Emit member removed event
    await this.emitMemberRemoved(groupId, targetUserId, userId);

    return { message: 'Member removed' };
  }

  async leaveGroup(groupId: string, userId: string) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      include: {
        members: { where: { leftAt: null } },
        conversation: { include: { members: { where: { leftAt: null } } } },
      },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    const membership = group.members.find((m) => m.userId === userId && !m.leftAt);
    if (!membership) {
      throw new NotFoundException('Not a member of this group');
    }

    // Check if user is the last admin
    if (membership.role === GroupRole.OWNER || membership.role === GroupRole.ADMIN) {
      const adminCount = group.members.filter(
        (m) => m.role === GroupRole.ADMIN || m.role === GroupRole.OWNER,
      ).length;

      if (adminCount <= 1) {
        // Auto-promote another member or require ownership transfer
        const otherMembers = group.members.filter((m) => m.userId !== userId);
        if (otherMembers.length > 0) {
          // Auto-promote the earliest joined member
          const newAdmin = otherMembers.sort((a, b) => a.joinedAt.getTime() - b.joinedAt.getTime())[0];
          await this.prisma.$transaction(async (tx) => {
            await tx.groupMember.update({
              where: { groupId_userId: { groupId, userId: newAdmin.userId } },
              data: { role: GroupRole.ADMIN },
            });
            await tx.conversationMember.update({
              where: { conversationId_userId: { conversationId: group.conversationId, userId: newAdmin.userId } },
              data: { role: GroupRole.ADMIN },
            });
          });
        }
      }
    }

    // Leave in transaction
    await this.prisma.$transaction(async (tx) => {
      await tx.groupMember.update({
        where: { groupId_userId: { groupId, userId } },
        data: { leftAt: new Date() },
      });

      await tx.conversationMember.update({
        where: { conversationId_userId: { conversationId: group.conversationId, userId } },
        data: { leftAt: new Date() },
      });
    });

    // Emit member left event
    await this.emitMemberLeft(groupId, userId);

    return { message: 'Left group' };
  }

  async promoteAdmin(groupId: string, userId: string, targetUserId: string) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      include: { members: { where: { leftAt: null } } },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    const requesterMembership = group.members.find((m) => m.userId === userId && !m.leftAt);
    if (!requesterMembership || requesterMembership.role !== GroupRole.OWNER) {
      throw new ForbiddenException('Only owner can promote admins');
    }

    const targetMembership = group.members.find((m) => m.userId === targetUserId && !m.leftAt);
    if (!targetMembership) {
      throw new NotFoundException('Target user is not a member');
    }

    if (targetMembership.role === GroupRole.ADMIN || targetMembership.role === GroupRole.OWNER) {
      throw new BadRequestException('User is already an admin');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.groupMember.update({
        where: { groupId_userId: { groupId, userId: targetUserId } },
        data: { role: GroupRole.ADMIN },
      });

      await tx.conversationMember.update({
        where: { conversationId_userId: { conversationId: group.conversationId, userId: targetUserId } },
        data: { role: GroupRole.ADMIN },
      });
    });

    await this.emitMemberPromoted(groupId, targetUserId, userId);

    return { message: 'Member promoted to admin' };
  }

  async demoteAdmin(groupId: string, userId: string, targetUserId: string) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      include: { members: { where: { leftAt: null } } },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    const requesterMembership = group.members.find((m) => m.userId === userId && !m.leftAt);
    if (!requesterMembership || requesterMembership.role !== GroupRole.OWNER) {
      throw new ForbiddenException('Only owner can demote admins');
    }

    const targetMembership = group.members.find((m) => m.userId === targetUserId && !m.leftAt);
    if (!targetMembership) {
      throw new NotFoundException('Target user is not a member');
    }

    if (targetMembership.role !== GroupRole.ADMIN) {
      throw new BadRequestException('User is not an admin');
    }

    // Prevent demoting the last admin
    const adminCount = group.members.filter(
      (m) => m.role === GroupRole.ADMIN || m.role === GroupRole.OWNER,
    ).length;

    if (adminCount <= 1) {
      throw new BadRequestException('Cannot demote the last admin');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.groupMember.update({
        where: { groupId_userId: { groupId, userId: targetUserId } },
        data: { role: GroupRole.MEMBER },
      });

      await tx.conversationMember.update({
        where: { conversationId_userId: { conversationId: group.conversationId, userId: targetUserId } },
        data: { role: GroupRole.MEMBER },
      });
    });

    await this.emitMemberDemoted(groupId, targetUserId, userId);

    return { message: 'Admin demoted to member' };
  }

  async getGroupMembers(groupId: string, userId: string, page = 1, limit = 50) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      include: { members: { where: { leftAt: null }, include: { user: { include: { profile: true } } } } },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    // Verify membership
    const membership = group.members.find((m) => m.userId === userId && !m.leftAt);
    if (!membership) {
      throw new ForbiddenException('Not a member of this group');
    }

    const members = group.members.slice((page - 1) * limit, page * limit);

    return {
      data: members.map((m) => ({
        id: m.id,
        userId: m.userId,
        role: m.role,
        joinedAt: m.joinedAt,
        isMuted: m.isMuted,
        muteUntil: m.muteUntil,
        user: m.user ? {
          id: m.user.id,
          displayName: m.user.profile?.displayName,
          avatarUrl: m.user.profile?.avatarUrl,
          about: m.user.profile?.about,
        } : null,
      })),
      meta: { page, limit, total: group.members.length, totalPages: Math.ceil(group.members.length / limit) },
    };
  }

  async searchGroups(query: string, userId: string, limit = 20) {
    if (!query || query.trim().length < 2) return [];

    const searchTerm = query.trim();

    const groups = await this.prisma.group.findMany({
      where: {
        name: { contains: searchTerm, mode: 'insensitive' },
        members: { some: { userId, leftAt: null } },
      },
      include: {
        conversation: {
          include: {
            members: {
              where: { userId: { not: userId }, leftAt: null },
              include: { user: { include: { profile: true } } },
              take: 5,
            },
          },
        },
        members: { where: { leftAt: null }, include: { user: { include: { profile: true } } } },
        _count: { select: { members: true } },
      },
      take: limit,
      orderBy: { updatedAt: 'desc' },
    });

    return groups.map((g) => this.enrichGroup(g, userId));
  }

  async deleteGroup(groupId: string, userId: string) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      include: { members: { where: { userId, leftAt: null } } },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    const membership = group.members[0];
    if (!membership || membership.role !== GroupRole.OWNER) {
      throw new ForbiddenException('Only owner can delete group');
    }

    // Soft delete conversation (marks as deleted for all members)
    await this.prisma.conversation.update({
      where: { id: group.conversationId },
      data: { deletedAt: new Date() },
    });

    // Mark all members as left
    await this.prisma.conversationMember.updateMany({
      where: { conversationId: group.conversationId, leftAt: null },
      data: { leftAt: new Date() },
    });

    await this.prisma.groupMember.updateMany({
      where: { groupId, leftAt: null },
      data: { leftAt: new Date() },
    });

    // Emit group deleted event
    await this.emitGroupDeleted(groupId);

    return { message: 'Group deleted' };
  }

  async getGroupAvatarUploadUrl(groupId: string, userId: string, fileName: string, contentType: string) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      include: { members: { where: { userId, leftAt: null } } },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    const membership = group.members[0];
    if (!membership || (membership.role !== GroupRole.OWNER && membership.role !== GroupRole.ADMIN)) {
      throw new ForbiddenException('Only admins can update group avatar');
    }

    return this.mediaService.getAvatarUploadUrl(`group-${groupId}`, { fileName, contentType });
  }

  async updateGroupAvatar(groupId: string, userId: string, avatarUrl: string) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      include: { members: { where: { userId, leftAt: null } } },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    const membership = group.members[0];
    if (!membership || (membership.role !== GroupRole.OWNER && membership.role !== GroupRole.ADMIN)) {
      throw new ForbiddenException('Only admins can update group avatar');
    }

    const updated = await this.prisma.group.update({
      where: { id: groupId },
      data: { avatarUrl },
    });

    await this.prisma.conversation.update({
      where: { id: group.conversationId },
      data: { avatarUrl },
    });

    await this.emitGroupUpdated(groupId, { ...group, avatarUrl });

    return this.enrichGroup(
      { ...updated, conversation: { ...group.conversation, avatarUrl }, members: group.members },
      userId,
    );
  }

  // Permission helpers
  private canRemoveMember(requester: any, target: any): boolean {
    if (requester.role === GroupRole.OWNER) return true;
    if (requester.role === GroupRole.ADMIN && target.role === GroupRole.MEMBER) return true;
    return false;
  }

  private enrichGroup(group: any, userId: string) {
    const membership = group.members.find((m: any) => m.userId === userId);
    const otherMembers = group.members.filter((m: any) => m.userId !== userId);

    return {
      id: group.id,
      conversationId: group.conversationId,
      name: group.name,
      description: group.description,
      avatarUrl: group.avatarUrl,
      settings: group.settings,
      role: membership?.role,
      isMuted: membership?.isMuted,
      muteUntil: membership?.muteUntil,
      memberCount: group._count?.members || group.members.length,
      members: otherMembers.map((m: any) => ({
        id: m.id,
        userId: m.userId,
        role: m.role,
        joinedAt: m.joinedAt,
        user: m.user ? {
          id: m.user.id,
          displayName: m.user.profile?.displayName,
          avatarUrl: m.user.profile?.avatarUrl,
        } : null,
      })),
      createdAt: group.createdAt,
      updatedAt: group.updatedAt,
    };
  }

  // Real-time event emitters
  private async emitGroupUpdated(groupId: string, group: any) {
    await this.redis.publish(`group:${groupId}:updated`, JSON.stringify({ groupId, group }));
  }

  private async emitMemberAdded(groupId: string, memberId: string, addedBy: string) {
    await this.redis.publish(`group:${groupId}:member_added`, JSON.stringify({ groupId, memberId, addedBy }));
  }

  private async emitMemberRemoved(groupId: string, memberId: string, removedBy: string) {
    await this.redis.publish(`group:${groupId}:member_removed`, JSON.stringify({ groupId, memberId, removedBy }));
  }

  private async emitMemberLeft(groupId: string, memberId: string) {
    await this.redis.publish(`group:${groupId}:member_left`, JSON.stringify({ groupId, memberId }));
  }

  private async emitMemberPromoted(groupId: string, memberId: string, promotedBy: string) {
    await this.redis.publish(`group:${groupId}:member_promoted`, JSON.stringify({ groupId, memberId, promotedBy }));
  }

  private async emitMemberDemoted(groupId: string, memberId: string, demotedBy: string) {
    await this.redis.publish(`group:${groupId}:member_demoted`, JSON.stringify({ groupId, memberId, demotedBy }));
  }

  private async emitGroupDeleted(groupId: string) {
    await this.redis.publish(`group:${groupId}:deleted`, JSON.stringify({ groupId }));
  }
}