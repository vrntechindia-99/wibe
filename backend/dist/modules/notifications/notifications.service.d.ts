import { PrismaService } from '@shared/database/prisma.service';
import { RedisService } from '@shared/database/redis.service';
export declare class NotificationsService {
    private readonly prisma;
    private readonly redis;
    constructor(prisma: PrismaService, redis: RedisService);
    getNotifications(userId: string, page?: number, limit?: number, unreadOnly?: boolean): Promise<{
        data: any;
        meta: {
            page: number;
            limit: number;
            total: any;
            totalPages: number;
        };
    }>;
    markAsRead(userId: string, notificationId: string): Promise<{
        message: string;
    }>;
    markAllAsRead(userId: string): Promise<{
        message: string;
    }>;
    createNotification(userId: string, type: string, title: string, body?: string, data?: any): Promise<any>;
    getUnreadCount(userId: string): Promise<any>;
}
