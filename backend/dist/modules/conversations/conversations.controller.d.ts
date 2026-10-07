import { Request } from 'express';
import { ConversationsService } from './services/conversations.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { ConversationQueryDto } from './dto/conversation-query.dto';
import { MuteConversationDto } from './dto/mute-conversation.dto';
export declare class ConversationsController {
    private readonly conversationsService;
    constructor(conversationsService: ConversationsService);
    getConversations(query: ConversationQueryDto, req: Request): Promise<{
        data: any;
        meta: {
            page: number;
            limit: number;
            total: any;
            totalPages: number;
        };
    }>;
    createConversation(dto: CreateConversationDto, req: Request): Promise<{
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
    getConversation(conversationId: string, req: Request): Promise<{
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
    updateConversation(conversationId: string, dto: UpdateConversationDto, req: Request): Promise<{
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
    pinConversation(conversationId: string, req: Request): Promise<{
        message: string;
    }>;
    unpinConversation(conversationId: string, req: Request): Promise<{
        message: string;
    }>;
    muteConversation(conversationId: string, dto: MuteConversationDto, req: Request): Promise<{
        message: string;
    }>;
    unmuteConversation(conversationId: string, req: Request): Promise<{
        message: string;
    }>;
    archiveConversation(conversationId: string, req: Request): Promise<{
        message: string;
    }>;
    unarchiveConversation(conversationId: string, req: Request): Promise<{
        message: string;
    }>;
    markUnread(conversationId: string, req: Request): Promise<{
        message: string;
    }>;
    markAsRead(conversationId: string, messageId: string, req: Request): Promise<{
        message: string;
    }>;
    markAsDelivered(conversationId: string, messageId: string, req: Request): Promise<{
        message: string;
    }>;
    deleteConversation(conversationId: string, forEveryone: boolean, req: Request): Promise<{
        message: string;
    }>;
}
