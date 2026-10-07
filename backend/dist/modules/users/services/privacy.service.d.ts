import { PrismaService } from '@shared/database/prisma.service';
import { UpdatePrivacyDto } from '../dto/update-privacy.dto';
export declare class PrivacyService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getPrivacySettings(userId: string): Promise<any>;
    updatePrivacySettings(userId: string, dto: UpdatePrivacyDto): Promise<{
        lastSeen: any;
        profilePhoto: any;
        about: any;
        readReceipts: any;
        status: any;
        groups: any;
    }>;
    canViewLastSeen(targetUserId: string, requesterId: string): Promise<boolean>;
    canViewProfilePhoto(targetUserId: string, requesterId: string): Promise<boolean>;
    canViewAbout(targetUserId: string, requesterId: string): Promise<boolean>;
    canViewStatus(targetUserId: string, requesterId: string): Promise<boolean>;
    canViewReadReceipts(targetUserId: string): Promise<boolean>;
    canAddToGroup(targetUserId: string, requesterId: string): Promise<boolean>;
    private checkPrivacyLevel;
    private areContacts;
    private isExcepted;
    private isSelected;
}
