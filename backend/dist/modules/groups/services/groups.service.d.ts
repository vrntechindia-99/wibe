import { PrismaService } from '@shared/database/prisma.service';
import { RedisService } from '@shared/database/redis.service';
import { MediaService } from '@modules/media/services/media.service';
import { CreateGroupDto } from '../dto/create-group.dto';
import { UpdateGroupDto } from '../dto/update-group.dto';
import { GroupSettingsDto } from '../dto/group-settings.dto';
import { GroupQueryDto } from '../dto/group-query.dto';
export declare class GroupsService {
    private readonly prisma;
    private readonly redis;
    private readonly mediaService;
    constructor(prisma: PrismaService, redis: RedisService, mediaService: MediaService);
    createGroup(creatorId: string, dto: CreateGroupDto): Promise<any>;
    getUserGroups(userId: string, query: GroupQueryDto): Promise<{
        data: any;
        meta: {
            page: number;
            limit: number;
            total: any;
            totalPages: number;
        };
    }>;
    getGroup(groupId: string, userId: string): Promise<{
        id: any;
        conversationId: any;
        name: any;
        description: any;
        avatarUrl: any;
        settings: any;
        role: any;
        isMuted: any;
        muteUntil: any;
        memberCount: any;
        members: any;
        createdAt: any;
        updatedAt: any;
    }>;
    updateGroup(groupId: string, userId: string, dto: UpdateGroupDto): Promise<{
        id: any;
        conversationId: any;
        name: any;
        description: any;
        avatarUrl: any;
        settings: any;
        role: any;
        isMuted: any;
        muteUntil: any;
        memberCount: any;
        members: any;
        createdAt: any;
        updatedAt: any;
    }>;
    updateGroupSettings(groupId: string, userId: string, dto: GroupSettingsDto): Promise<{
        message: string;
    }>;
    addMembers(groupId: string, userId: string, memberIds: string[]): Promise<{
        message: string;
    }>;
    removeMember(groupId: string, userId: string, targetUserId: string): Promise<{
        message: string;
    }>;
    leaveGroup(groupId: string, userId: string): Promise<{
        message: string;
    }>;
    promoteAdmin(groupId: string, userId: string, targetUserId: string): Promise<{
        message: string;
    }>;
    demoteAdmin(groupId: string, userId: string, targetUserId: string): Promise<{
        message: string;
    }>;
    getGroupMembers(groupId: string, userId: string, page?: number, limit?: number): Promise<{
        data: any;
        meta: {
            page: number;
            limit: number;
            total: any;
            totalPages: number;
        };
    }>;
    searchGroups(query: string, userId: string, limit?: number): Promise<any>;
    deleteGroup(groupId: string, userId: string): Promise<{
        message: string;
    }>;
    getGroupAvatarUploadUrl(groupId: string, userId: string, fileName: string, contentType: string): Promise<any>;
    updateGroupAvatar(groupId: string, userId: string, avatarUrl: string): Promise<{
        id: any;
        conversationId: any;
        name: any;
        description: any;
        avatarUrl: any;
        settings: any;
        role: any;
        isMuted: any;
        muteUntil: any;
        memberCount: any;
        members: any;
        createdAt: any;
        updatedAt: any;
    }>;
    private canRemoveMember;
    private enrichGroup;
    private emitGroupUpdated;
    private emitMemberAdded;
    private emitMemberRemoved;
    private emitMemberLeft;
    private emitMemberPromoted;
    private emitMemberDemoted;
    private emitGroupDeleted;
}
