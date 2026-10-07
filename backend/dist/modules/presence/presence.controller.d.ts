import { Request } from 'express';
import { PresenceService } from './presence.service';
export declare class PresenceController {
    private readonly presenceService;
    constructor(presenceService: PresenceService);
    getUserPresence(userId: string, req: Request): Promise<{
        online: boolean;
        lastSeen: any;
    }>;
    getUsersPresence(ids: string, req: Request): Promise<Record<string, {
        online: boolean;
        lastSeen: Date | null;
    }>>;
    getConversationPresence(conversationId: string, req: Request): Promise<Record<string, {
        online: boolean;
        lastSeen: Date | null;
    }>>;
}
