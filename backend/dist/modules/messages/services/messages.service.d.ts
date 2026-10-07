import { PrismaService } from '@shared/database/prisma.service';
import { RedisService } from '@shared/database/redis.service';
import { SendMessageDto } from '../dto/send-message.dto';
import { UpdateMessageDto } from '../dto/update-message.dto';
import { MessageQueryDto } from '../dto/message-query.dto';
export declare class MessagesService {
    private readonly prisma;
    private readonly redis;
    constructor(prisma: PrismaService, redis: RedisService);
    sendMessage(conversationId: string, senderId: string, dto: SendMessageDto): Promise<{
        id: any;
        clientMessageId: any;
        conversationId: any;
        senderId: any;
        type: any;
        content: any;
        status: any;
        replyToId: any;
        isEdited: boolean;
        editedAt: any;
        isDeleted: boolean;
        deletedForEveryone: any;
        createdAt: any;
        updatedAt: any;
        sender: {
            id: any;
            displayName: any;
            avatarUrl: any;
        } | undefined;
        replyTo: {
            id: any;
            content: any;
            senderId: any;
            sender: {
                id: any;
                displayName: any;
            } | undefined;
        } | undefined;
        attachments: any;
        reactions: any;
        readReceipts: any;
    }>;
    getMessages(conversationId: string, userId: string, query: MessageQueryDto): Promise<{
        data: any;
        meta: {
            page: number;
            limit: number;
            total: any;
            totalPages: number;
        };
    }>;
    getMessage(messageId: string, userId: string): Promise<{
        id: any;
        clientMessageId: any;
        conversationId: any;
        senderId: any;
        type: any;
        content: any;
        status: any;
        replyToId: any;
        isEdited: boolean;
        editedAt: any;
        isDeleted: boolean;
        deletedForEveryone: any;
        createdAt: any;
        updatedAt: any;
        sender: {
            id: any;
            displayName: any;
            avatarUrl: any;
        } | undefined;
        replyTo: {
            id: any;
            content: any;
            senderId: any;
            sender: {
                id: any;
                displayName: any;
            } | undefined;
        } | undefined;
        attachments: any;
        reactions: any;
        readReceipts: any;
    }>;
    updateMessage(messageId: string, userId: string, dto: UpdateMessageDto): Promise<{
        id: any;
        clientMessageId: any;
        conversationId: any;
        senderId: any;
        type: any;
        content: any;
        status: any;
        replyToId: any;
        isEdited: boolean;
        editedAt: any;
        isDeleted: boolean;
        deletedForEveryone: any;
        createdAt: any;
        updatedAt: any;
        sender: {
            id: any;
            displayName: any;
            avatarUrl: any;
        } | undefined;
        replyTo: {
            id: any;
            content: any;
            senderId: any;
            sender: {
                id: any;
                displayName: any;
            } | undefined;
        } | undefined;
        attachments: any;
        reactions: any;
        readReceipts: any;
    }>;
    deleteMessage(messageId: string, userId: string, forEveryone?: boolean): Promise<{
        message: string;
    }>;
    searchMessages(userId: string, query: string, conversationId?: string, limit?: number): Promise<any>;
    private emitNewMessage;
    private emitMessageUpdated;
    private emitMessageDeleted;
    private formatMessage;
}
