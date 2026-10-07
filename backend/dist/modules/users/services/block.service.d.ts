import { PrismaService } from '@shared/database/prisma.service';
export declare class BlockService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    blockUser(blockerId: string, blockedId: string): Promise<{
        message: string;
    }>;
    unblockUser(blockerId: string, blockedId: string): Promise<{
        message: string;
    }>;
    getBlockedUsers(userId: string): Promise<any>;
    isBlocked(blockerId: string, blockedId: string): Promise<boolean>;
    isBlockedEitherWay(userId1: string, userId2: string): Promise<boolean>;
    private deleteDirectConversation;
}
