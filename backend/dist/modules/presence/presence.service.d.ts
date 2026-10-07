import { PrismaService } from '@shared/database/prisma.service';
import { RedisService } from '@shared/database/redis.service';
import { PrivacyService } from '@modules/users/services/privacy.service';
export declare class PresenceService {
    private readonly prisma;
    private readonly redis;
    private readonly privacyService;
    private readonly logger;
    constructor(prisma: PrismaService, redis: RedisService, privacyService: PrivacyService);
    getPresence(userId: string, requesterId: string): Promise<{
        online: boolean;
        lastSeen: any;
    }>;
    getOnlineUsers(userIds: string[], requesterId: string): Promise<Record<string, {
        online: boolean;
        lastSeen: Date | null;
    }>>;
    getConversationPresence(conversationId: string, userId: string): Promise<Record<string, {
        online: boolean;
        lastSeen: Date | null;
    }>>;
    updateLastActive(userId: string): Promise<void>;
    isOnline(userId: string): Promise<boolean>;
}
