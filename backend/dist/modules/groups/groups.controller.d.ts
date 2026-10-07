import { Request } from 'express';
import { GroupsService } from './services/groups.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { GroupSettingsDto } from './dto/group-settings.dto';
import { GroupQueryDto } from './dto/group-query.dto';
export declare class GroupsController {
    private readonly groupsService;
    constructor(groupsService: GroupsService);
    getGroups(query: GroupQueryDto, req: Request): Promise<{
        data: any;
        meta: {
            page: number;
            limit: number;
            total: any;
            totalPages: number;
        };
    }>;
    createGroup(dto: CreateGroupDto, req: Request): Promise<any>;
    searchGroups(query: string, limit: number, req: Request): Promise<any>;
    getGroup(groupId: string, req: Request): Promise<{
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
    updateGroup(groupId: string, dto: UpdateGroupDto, req: Request): Promise<{
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
    updateSettings(groupId: string, dto: GroupSettingsDto, req: Request): Promise<{
        message: string;
    }>;
    getAvatarUploadUrl(groupId: string, fileName: string, contentType: string, req: Request): Promise<any>;
    updateAvatar(groupId: string, avatarUrl: string, req: Request): Promise<{
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
    addMembers(groupId: string, memberIds: string[], req: Request): Promise<{
        message: string;
    }>;
    removeMember(groupId: string, targetUserId: string, req: Request): Promise<{
        message: string;
    }>;
    leaveGroup(groupId: string, req: Request): Promise<{
        message: string;
    }>;
    promoteAdmin(groupId: string, targetUserId: string, req: Request): Promise<{
        message: string;
    }>;
    demoteAdmin(groupId: string, targetUserId: string, req: Request): Promise<{
        message: string;
    }>;
    getMembers(groupId: string, page: number, limit: number, req: Request): Promise<{
        data: any;
        meta: {
            page: number;
            limit: number;
            total: any;
            totalPages: number;
        };
    }>;
    deleteGroup(groupId: string, req: Request): Promise<{
        message: string;
    }>;
}
