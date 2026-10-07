import { PrismaService } from '@shared/database/prisma.service';
import { RedisService } from '@shared/database/redis.service';
import { CreateConversationDto } from '../dto/create-conversation.dto';
import { UpdateConversationDto } from '../dto/update-conversation.dto';
import { ConversationQueryDto } from '../dto/conversation-query.dto';
import { MuteConversationDto } from '../dto/mute-conversation.dto';
export declare class ConversationsService {
    private readonly prisma;
    private readonly redis;
    constructor(prisma: PrismaService, redis: RedisService);
    createDirectConversation(userId: string, dto: CreateConversationDto): Promise<{
        id: any;
        type: any;
        name: any;
        avatarUrl: any;
        isPinned: any;
        isArchived: any;
        isMuted: any;
        muteUntil: any;
        unreadCount: any;
        lastMessage: {
            id: any;
            clientMessageId: any;
            conversationId: any;
            senderId: any;
            type: any;
            content: any;
            status: any;
            replyToId: any;
            isEdited: boolean;
            isDeleted: boolean;
            createdAt: any;
            updatedAt: any;
            sender: {
                id: any;
                displayName: any;
                avatarUrl: any;
            } | undefined;
        } | null;
        members: any;
        group: any;
        createdAt: any;
        updatedAt: any;
    }>;
    createGroupConversation(userId: string, dto: CreateConversationDto): Promise<{
        id: any;
        type: any;
        name: any;
        avatarUrl: any;
        isPinned: any;
        isArchived: any;
        isMuted: any;
        muteUntil: any;
        unreadCount: any;
        lastMessage: {
            id: any;
            clientMessageId: any;
            conversationId: any;
            senderId: any;
            type: any;
            content: any;
            status: any;
            replyToId: any;
            isEdited: boolean;
            isDeleted: boolean;
            createdAt: any;
            updatedAt: any;
            sender: {
                id: any;
                displayName: any;
                avatarUrl: any;
            } | undefined;
        } | null;
        members: any;
        group: any;
        createdAt: any;
        updatedAt: any;
    }>;
    getConversations(userId: string, query: ConversationQueryDto): Promise<{
        data: any;
        meta: {
            page: number;
            limit: number;
            total: any;
            totalPages: number;
        };
    }>;
    getConversation(conversationId: string, userId: string): Promise<{
        id: any;
        type: any;
        name: any;
        avatarUrl: any;
        isPinned: any;
        isArchived: any;
        isMuted: any;
        muteUntil: any;
        unreadCount: any;
        lastMessage: {
            id: any;
            clientMessageId: any;
            conversationId: any;
            senderId: any;
            type: any;
            content: any;
            status: any;
            replyToId: any;
            isEdited: boolean;
            isDeleted: boolean;
            createdAt: any;
            updatedAt: any;
            sender: {
                id: any;
                displayName: any;
                avatarUrl: any;
            } | undefined;
        } | null;
        members: any;
        group: any;
        createdAt: any;
        updatedAt: any;
    }>;
    private getConversationForUser;
    private enrichConversation;
    private formatMessage;
    updateConversation(conversationId: string, userId: string, dto: UpdateConversationDto): Promise<{
        id: any;
        type: any;
        name: any;
        avatarUrl: any;
        isPinned: any;
        isArchived: any;
        isMuted: any;
        muteUntil: any;
        unreadCount: any;
        lastMessage: {
            id: any;
            clientMessageId: any;
            conversationId: any;
            senderId: any;
            type: any;
            content: any;
            status: any;
            replyToId: any;
            isEdited: boolean;
            isDeleted: boolean;
            createdAt: any;
            updatedAt: any;
            sender: {
                id: any;
                displayName: any;
                avatarUrl: any;
            } | undefined;
        } | null;
        members: any;
        group: any;
        createdAt: any;
        updatedAt: any;
    }>;
    pinConversation(conversationId: string, userId: string): Promise<{
        message: string;
    }>;
    unpinConversation(conversationId: string, userId: string): Promise<{
        message: string;
    }>;
    muteConversation(conversationId: string, userId: string, dto: MuteConversationDto): Promise<{
        message: string;
    }>;
    unmuteConversation(conversationId: string, userId: string): Promise<{
        message: string;
    }>;
    archiveConversation(conversationId: string, userId: string): Promise<{
        message: string;
    }>;
    unarchiveConversation(conversationId: string, userId: string): Promise<{
        message: string;
    }>;
    markUnread(conversationId: string, userId: string): Promise<{
        message: string;
    }>;
    deleteConversation(conversationId: string, userId: string, forEveryone?: boolean): Promise<{
        message: string;
    }>;
    markAsRead(conversationId: string, userId: string, messageId?: string): Promise<{
        message: string;
    }>;
    markAsDelivered(conversationId: string, userId: string, messageId: string): Promise<{
        message: string;
    }>;
    private getMembershipOrThrow;
}
