import { PrismaService } from '@shared/database/prisma.service';
export declare class UsersService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findById(userId: string): Promise<any>;
    findByPhoneNumber(phoneNumber: string): Promise<any>;
    searchUsers(query: string, currentUserId: string, limit?: number): Promise<any>;
    getUserProfile(userId: string, requesterId: string): Promise<{
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
    private canViewProfile;
    private filterProfileByPrivacy;
    updateLastSeen(userId: string): Promise<void>;
}
