"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GroupsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("@shared/database/prisma.service");
const redis_service_1 = require("@shared/database/redis.service");
const media_service_1 = require("@modules/media/services/media.service");
const client_1 = require("@prisma/client");
const group_query_dto_1 = require("../dto/group-query.dto");
let GroupsService = class GroupsService {
    constructor(prisma, redis, mediaService) {
        this.prisma = prisma;
        this.redis = redis;
        this.mediaService = mediaService;
    }
    async createGroup(creatorId, dto) {
        const uniqueMemberIds = [...new Set([creatorId, ...dto.memberIds])];
        if (uniqueMemberIds.length < 2) {
            throw new common_1.BadRequestException('Group must have at least 2 members');
        }
        if (uniqueMemberIds.length > 500) {
            throw new common_1.BadRequestException('Group cannot have more than 500 members');
        }
        const users = await this.prisma.user.findMany({
            where: { id: { in: uniqueMemberIds } },
        });
        if (users.length !== uniqueMemberIds.length) {
            throw new common_1.NotFoundException('One or more users not found');
        }
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
                throw new common_1.ForbiddenException(`Cannot add blocked user: ${memberId}`);
            }
        }
        const result = await this.prisma.$transaction(async (tx) => {
            const conversation = await tx.conversation.create({
                data: {
                    type: client_1.ConversationType.GROUP,
                    name: dto.name,
                    description: dto.description,
                    createdBy: creatorId,
                    members: {
                        create: uniqueMemberIds.map((userId) => ({
                            userId,
                            role: userId === creatorId ? client_1.GroupRole.OWNER : client_1.GroupRole.MEMBER,
                            invitedBy: userId === creatorId ? null : creatorId,
                        })),
                    },
                },
                include: { members: true },
            });
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
                            role: userId === creatorId ? client_1.GroupRole.OWNER : client_1.GroupRole.MEMBER,
                            invitedBy: userId === creatorId ? null : creatorId,
                        })),
                    },
                },
            });
            return { conversation, group };
        });
        return this.getGroupForUser(result.conversation.id, creatorId);
    }
    async getUserGroups(userId, query) {
        const { page = 1, limit = 20, sortBy = group_query_dto_1.GroupSortBy.UPDATED_AT, sortOrder = group_query_dto_1.SortOrder.DESC, search } = query;
        const where = {
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
        const orderBy = {};
        if (sortBy === group_query_dto_1.GroupSortBy.MEMBER_COUNT) {
            orderBy.updatedAt = sortOrder;
        }
        else {
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
        const enriched = await Promise.all(groups.map((g) => this.enrichGroup(g, userId)));
        if (sortBy === group_query_dto_1.GroupSortBy.MEMBER_COUNT) {
            enriched.sort((a, b) => sortOrder === group_query_dto_1.SortOrder.DESC
                ? b.memberCount - a.memberCount
                : a.memberCount - b.memberCount);
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
    async getGroup(groupId, userId) {
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
            throw new common_1.NotFoundException('Group not found');
        }
        const membership = group.members.find((m) => m.userId === userId && !m.leftAt);
        if (!membership) {
            throw new common_1.ForbiddenException('Not a member of this group');
        }
        return this.enrichGroup(group, userId);
    }
    async updateGroup(groupId, userId, dto) {
        const group = await this.prisma.group.findUnique({
            where: { id: groupId },
            include: { members: { where: { userId, leftAt: null } } },
        });
        if (!group) {
            throw new common_1.NotFoundException('Group not found');
        }
        const membership = group.members[0];
        if (!membership || membership.role === client_1.GroupRole.MEMBER) {
            throw new common_1.ForbiddenException('Only admins can update group');
        }
        let avatarUrl = dto.avatarUrl;
        if (avatarUrl && avatarUrl !== group.avatarUrl) {
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
        if (dto.name && dto.name !== group.name) {
            await this.prisma.conversation.update({
                where: { id: group.conversationId },
                data: { name: dto.name },
            });
        }
        await this.emitGroupUpdated(groupId, updated);
        return this.enrichGroup({ ...updated, members: group.members }, userId);
    }
    async updateGroupSettings(groupId, userId, dto) {
        const group = await this.prisma.group.findUnique({
            where: { id: groupId },
            include: { members: { where: { userId, leftAt: null } } },
        });
        if (!group) {
            throw new common_1.NotFoundException('Group not found');
        }
        const membership = group.members[0];
        if (!membership || membership.role === client_1.GroupRole.MEMBER) {
            throw new common_1.ForbiddenException('Only admins can update settings');
        }
        const currentSettings = group.settings || {};
        const newSettings = { ...currentSettings, ...dto };
        await this.prisma.group.update({
            where: { id: groupId },
            data: { settings: newSettings },
        });
        await this.emitGroupUpdated(groupId, { ...group, settings: newSettings });
        return { message: 'Settings updated' };
    }
    async addMembers(groupId, userId, memberIds) {
        const group = await this.prisma.group.findUnique({
            where: { id: groupId },
            include: {
                members: { where: { leftAt: null } },
                conversation: { include: { members: { where: { leftAt: null } } } },
            },
        });
        if (!group) {
            throw new common_1.NotFoundException('Group not found');
        }
        const membership = group.members.find((m) => m.userId === userId && !m.leftAt);
        if (!membership) {
            throw new common_1.ForbiddenException('Not a member of this group');
        }
        const settings = group.settings || {};
        const onlyAdminsCanAdd = settings.onlyAdminsCanAddMembers ?? false;
        if (onlyAdminsCanAdd && membership.role === client_1.GroupRole.MEMBER) {
            throw new common_1.ForbiddenException('Only admins can add members');
        }
        const maxMembers = settings.maxMembers || 500;
        if (group.members.length + memberIds.length > maxMembers) {
            throw new common_1.BadRequestException(`Group would exceed max members (${maxMembers})`);
        }
        const users = await this.prisma.user.findMany({
            where: { id: { in: memberIds } },
        });
        if (users.length !== memberIds.length) {
            throw new common_1.NotFoundException('One or more users not found');
        }
        const existingMemberIds = group.members.map((m) => m.userId);
        const newMemberIds = memberIds.filter((id) => !existingMemberIds.includes(id));
        if (newMemberIds.length === 0) {
            throw new common_1.ConflictException('All users are already members');
        }
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
                    throw new common_1.ForbiddenException(`Cannot add user due to block: ${memberId}`);
                }
            }
        }
        await this.prisma.$transaction(async (tx) => {
            await tx.groupMember.createMany({
                data: newMemberIds.map((userId) => ({
                    groupId,
                    userId,
                    role: client_1.GroupRole.MEMBER,
                    invitedBy: userId,
                })),
                skipDuplicates: true,
            });
            await tx.conversationMember.createMany({
                data: newMemberIds.map((userId) => ({
                    conversationId: group.conversationId,
                    userId,
                    role: client_1.GroupRole.MEMBER,
                })),
                skipDuplicates: true,
            });
        });
        for (const newMemberId of newMemberIds) {
            await this.emitMemberAdded(groupId, newMemberId, userId);
        }
        return { message: `${newMemberIds.length} members added` };
    }
    async removeMember(groupId, userId, targetUserId) {
        const group = await this.prisma.group.findUnique({
            where: { id: groupId },
            include: {
                members: { where: { leftAt: null } },
                conversation: { include: { members: { where: { leftAt: null } } } },
            },
        });
        if (!group) {
            throw new common_1.NotFoundException('Group not found');
        }
        const requesterMembership = group.members.find((m) => m.userId === userId && !m.leftAt);
        if (!requesterMembership) {
            throw new common_1.ForbiddenException('Not a member of this group');
        }
        const targetMembership = group.members.find((m) => m.userId === targetUserId && !m.leftAt);
        if (!targetMembership) {
            throw new common_1.NotFoundException('Target user is not a member');
        }
        const canRemove = this.canRemoveMember(requesterMembership, targetMembership);
        if (!canRemove) {
            throw new common_1.ForbiddenException('Cannot remove this member');
        }
        if (targetMembership.role === client_1.GroupRole.ADMIN || targetMembership.role === client_1.GroupRole.OWNER) {
            const adminCount = group.members.filter((m) => m.role === client_1.GroupRole.ADMIN || m.role === client_1.GroupRole.OWNER).length;
            if (adminCount <= 1) {
                throw new common_1.BadRequestException('Cannot remove the last admin');
            }
        }
        await this.prisma.$transaction(async (tx) => {
            await tx.groupMember.update({
                where: { groupId_userId: { groupId, userId: targetUserId } },
                data: { leftAt: new Date() },
            });
            await tx.conversationMember.update({
                where: { conversationId_userId: { conversationId: group.conversationId, userId: targetUserId } },
                data: { leftAt: new Date() },
            });
        });
        await this.emitMemberRemoved(groupId, targetUserId, userId);
        return { message: 'Member removed' };
    }
    async leaveGroup(groupId, userId) {
        const group = await this.prisma.group.findUnique({
            where: { id: groupId },
            include: {
                members: { where: { leftAt: null } },
                conversation: { include: { members: { where: { leftAt: null } } } },
            },
        });
        if (!group) {
            throw new common_1.NotFoundException('Group not found');
        }
        const membership = group.members.find((m) => m.userId === userId && !m.leftAt);
        if (!membership) {
            throw new common_1.NotFoundException('Not a member of this group');
        }
        if (membership.role === client_1.GroupRole.OWNER || membership.role === client_1.GroupRole.ADMIN) {
            const adminCount = group.members.filter((m) => m.role === client_1.GroupRole.ADMIN || m.role === client_1.GroupRole.OWNER).length;
            if (adminCount <= 1) {
                const otherMembers = group.members.filter((m) => m.userId !== userId);
                if (otherMembers.length > 0) {
                    const newAdmin = otherMembers.sort((a, b) => a.joinedAt.getTime() - b.joinedAt.getTime())[0];
                    await this.prisma.$transaction(async (tx) => {
                        await tx.groupMember.update({
                            where: { groupId_userId: { groupId, userId: newAdmin.userId } },
                            data: { role: client_1.GroupRole.ADMIN },
                        });
                        await tx.conversationMember.update({
                            where: { conversationId_userId: { conversationId: group.conversationId, userId: newAdmin.userId } },
                            data: { role: client_1.GroupRole.ADMIN },
                        });
                    });
                }
            }
        }
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
        await this.emitMemberLeft(groupId, userId);
        return { message: 'Left group' };
    }
    async promoteAdmin(groupId, userId, targetUserId) {
        const group = await this.prisma.group.findUnique({
            where: { id: groupId },
            include: { members: { where: { leftAt: null } } },
        });
        if (!group) {
            throw new common_1.NotFoundException('Group not found');
        }
        const requesterMembership = group.members.find((m) => m.userId === userId && !m.leftAt);
        if (!requesterMembership || requesterMembership.role !== client_1.GroupRole.OWNER) {
            throw new common_1.ForbiddenException('Only owner can promote admins');
        }
        const targetMembership = group.members.find((m) => m.userId === targetUserId && !m.leftAt);
        if (!targetMembership) {
            throw new common_1.NotFoundException('Target user is not a member');
        }
        if (targetMembership.role === client_1.GroupRole.ADMIN || targetMembership.role === client_1.GroupRole.OWNER) {
            throw new common_1.BadRequestException('User is already an admin');
        }
        await this.prisma.$transaction(async (tx) => {
            await tx.groupMember.update({
                where: { groupId_userId: { groupId, userId: targetUserId } },
                data: { role: client_1.GroupRole.ADMIN },
            });
            await tx.conversationMember.update({
                where: { conversationId_userId: { conversationId: group.conversationId, userId: targetUserId } },
                data: { role: client_1.GroupRole.ADMIN },
            });
        });
        await this.emitMemberPromoted(groupId, targetUserId, userId);
        return { message: 'Member promoted to admin' };
    }
    async demoteAdmin(groupId, userId, targetUserId) {
        const group = await this.prisma.group.findUnique({
            where: { id: groupId },
            include: { members: { where: { leftAt: null } } },
        });
        if (!group) {
            throw new common_1.NotFoundException('Group not found');
        }
        const requesterMembership = group.members.find((m) => m.userId === userId && !m.leftAt);
        if (!requesterMembership || requesterMembership.role !== client_1.GroupRole.OWNER) {
            throw new common_1.ForbiddenException('Only owner can demote admins');
        }
        const targetMembership = group.members.find((m) => m.userId === targetUserId && !m.leftAt);
        if (!targetMembership) {
            throw new common_1.NotFoundException('Target user is not a member');
        }
        if (targetMembership.role !== client_1.GroupRole.ADMIN) {
            throw new common_1.BadRequestException('User is not an admin');
        }
        const adminCount = group.members.filter((m) => m.role === client_1.GroupRole.ADMIN || m.role === client_1.GroupRole.OWNER).length;
        if (adminCount <= 1) {
            throw new common_1.BadRequestException('Cannot demote the last admin');
        }
        await this.prisma.$transaction(async (tx) => {
            await tx.groupMember.update({
                where: { groupId_userId: { groupId, userId: targetUserId } },
                data: { role: client_1.GroupRole.MEMBER },
            });
            await tx.conversationMember.update({
                where: { conversationId_userId: { conversationId: group.conversationId, userId: targetUserId } },
                data: { role: client_1.GroupRole.MEMBER },
            });
        });
        await this.emitMemberDemoted(groupId, targetUserId, userId);
        return { message: 'Admin demoted to member' };
    }
    async getGroupMembers(groupId, userId, page = 1, limit = 50) {
        const group = await this.prisma.group.findUnique({
            where: { id: groupId },
            include: { members: { where: { leftAt: null }, include: { user: { include: { profile: true } } } } },
        });
        if (!group) {
            throw new common_1.NotFoundException('Group not found');
        }
        const membership = group.members.find((m) => m.userId === userId && !m.leftAt);
        if (!membership) {
            throw new common_1.ForbiddenException('Not a member of this group');
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
    async searchGroups(query, userId, limit = 20) {
        if (!query || query.trim().length < 2)
            return [];
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
    async deleteGroup(groupId, userId) {
        const group = await this.prisma.group.findUnique({
            where: { id: groupId },
            include: { members: { where: { userId, leftAt: null } } },
        });
        if (!group) {
            throw new common_1.NotFoundException('Group not found');
        }
        const membership = group.members[0];
        if (!membership || membership.role !== client_1.GroupRole.OWNER) {
            throw new common_1.ForbiddenException('Only owner can delete group');
        }
        await this.prisma.conversation.update({
            where: { id: group.conversationId },
            data: { deletedAt: new Date() },
        });
        await this.prisma.conversationMember.updateMany({
            where: { conversationId: group.conversationId, leftAt: null },
            data: { leftAt: new Date() },
        });
        await this.prisma.groupMember.updateMany({
            where: { groupId, leftAt: null },
            data: { leftAt: new Date() },
        });
        await this.emitGroupDeleted(groupId);
        return { message: 'Group deleted' };
    }
    async getGroupAvatarUploadUrl(groupId, userId, fileName, contentType) {
        const group = await this.prisma.group.findUnique({
            where: { id: groupId },
            include: { members: { where: { userId, leftAt: null } } },
        });
        if (!group) {
            throw new common_1.NotFoundException('Group not found');
        }
        const membership = group.members[0];
        if (!membership || (membership.role !== client_1.GroupRole.OWNER && membership.role !== client_1.GroupRole.ADMIN)) {
            throw new common_1.ForbiddenException('Only admins can update group avatar');
        }
        return this.mediaService.getAvatarUploadUrl(`group-${groupId}`, { fileName, contentType });
    }
    async updateGroupAvatar(groupId, userId, avatarUrl) {
        const group = await this.prisma.group.findUnique({
            where: { id: groupId },
            include: { members: { where: { userId, leftAt: null } } },
        });
        if (!group) {
            throw new common_1.NotFoundException('Group not found');
        }
        const membership = group.members[0];
        if (!membership || (membership.role !== client_1.GroupRole.OWNER && membership.role !== client_1.GroupRole.ADMIN)) {
            throw new common_1.ForbiddenException('Only admins can update group avatar');
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
        return this.enrichGroup({ ...updated, conversation: { ...group.conversation, avatarUrl }, members: group.members }, userId);
    }
    canRemoveMember(requester, target) {
        if (requester.role === client_1.GroupRole.OWNER)
            return true;
        if (requester.role === client_1.GroupRole.ADMIN && target.role === client_1.GroupRole.MEMBER)
            return true;
        return false;
    }
    enrichGroup(group, userId) {
        const membership = group.members.find((m) => m.userId === userId);
        const otherMembers = group.members.filter((m) => m.userId !== userId);
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
            members: otherMembers.map((m) => ({
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
    async emitGroupUpdated(groupId, group) {
        await this.redis.publish(`group:${groupId}:updated`, JSON.stringify({ groupId, group }));
    }
    async emitMemberAdded(groupId, memberId, addedBy) {
        await this.redis.publish(`group:${groupId}:member_added`, JSON.stringify({ groupId, memberId, addedBy }));
    }
    async emitMemberRemoved(groupId, memberId, removedBy) {
        await this.redis.publish(`group:${groupId}:member_removed`, JSON.stringify({ groupId, memberId, removedBy }));
    }
    async emitMemberLeft(groupId, memberId) {
        await this.redis.publish(`group:${groupId}:member_left`, JSON.stringify({ groupId, memberId }));
    }
    async emitMemberPromoted(groupId, memberId, promotedBy) {
        await this.redis.publish(`group:${groupId}:member_promoted`, JSON.stringify({ groupId, memberId, promotedBy }));
    }
    async emitMemberDemoted(groupId, memberId, demotedBy) {
        await this.redis.publish(`group:${groupId}:member_demoted`, JSON.stringify({ groupId, memberId, demotedBy }));
    }
    async emitGroupDeleted(groupId) {
        await this.redis.publish(`group:${groupId}:deleted`, JSON.stringify({ groupId }));
    }
};
exports.GroupsService = GroupsService;
exports.GroupsService = GroupsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object, typeof (_b = typeof redis_service_1.RedisService !== "undefined" && redis_service_1.RedisService) === "function" ? _b : Object, typeof (_c = typeof media_service_1.MediaService !== "undefined" && media_service_1.MediaService) === "function" ? _c : Object])
], GroupsService);
//# sourceMappingURL=groups.service.js.map