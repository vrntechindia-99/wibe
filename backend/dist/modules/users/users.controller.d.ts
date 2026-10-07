import { Request } from 'express';
import { UsersService } from './users.service';
import { ProfileService } from './services/profile.service';
import { PrivacyService } from './services/privacy.service';
import { BlockService } from './services/block.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateAvatarDto } from './dto/update-avatar.dto';
import { UpdatePrivacyDto } from './dto/update-privacy.dto';
export declare class UsersController {
    private readonly usersService;
    private readonly profileService;
    private readonly privacyService;
    private readonly blockService;
    constructor(usersService: UsersService, profileService: ProfileService, privacyService: PrivacyService, blockService: BlockService);
    getMe(req: Request): Promise<any>;
    searchUsers(query: string, limit: number, req: Request): Promise<any>;
    getUser(userId: string, req: Request): Promise<{
        user: any;
        profile: null;
        canView: boolean;
    } | {
        user: {
            id: any;
            phoneNumber: any;
            isVerified: any;
        };
        profile: any;
        canView: boolean;
    }>;
    updateProfile(dto: UpdateProfileDto, req: Request): Promise<any>;
    getAvatarUploadUrl(dto: UpdateAvatarDto, req: Request): Promise<{
        uploadUrl: any;
        downloadUrl: any;
        fileName: string;
    }>;
    confirmAvatar(avatarUrl: string, req: Request): Promise<any>;
    deleteAvatar(req: Request): Promise<any>;
    getPrivacySettings(req: Request): Promise<any>;
    updatePrivacySettings(dto: UpdatePrivacyDto, req: Request): Promise<{
        lastSeen: any;
        profilePhoto: any;
        about: any;
        readReceipts: any;
        status: any;
        groups: any;
    }>;
    blockUser(blockedId: string, req: Request): Promise<{
        message: string;
    }>;
    unblockUser(blockedId: string, req: Request): Promise<{
        message: string;
    }>;
    getBlockedUsers(req: Request): Promise<any>;
}
