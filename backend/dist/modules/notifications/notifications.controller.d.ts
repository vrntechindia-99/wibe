import { Request } from 'express';
import { NotificationsService } from './notifications.service';
export declare class NotificationsController {
    private readonly notificationsService;
    constructor(notificationsService: NotificationsService);
    getNotifications(page: number, limit: number, unreadOnly: boolean, req: Request): Promise<{
        data: any;
        meta: {
            page: number;
            limit: number;
            total: any;
            totalPages: number;
        };
    }>;
    getUnreadCount(req: Request): Promise<{
        count: any;
    }>;
    markAsRead(notificationId: string, req: Request): Promise<{
        message: string;
    }>;
    markAllAsRead(req: Request): Promise<{
        message: string;
    }>;
}
