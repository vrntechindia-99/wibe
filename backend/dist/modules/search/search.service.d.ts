import { PrismaService } from '@shared/database/prisma.service';
export declare class SearchService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    searchUsers(query: string, currentUserId: string, limit?: number): Promise<any>;
    searchConversations(query: string, userId: string, limit?: number): Promise<any>;
    searchMessages(query: string, userId: string, conversationId?: string, limit?: number): Promise<any>;
    private enrichConversation;
    private formatMessage;
}
