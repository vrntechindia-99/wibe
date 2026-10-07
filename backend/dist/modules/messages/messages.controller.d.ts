import { Request } from 'express';
import { MessagesService } from './services/messages.service';
import { SendMessageDto } from './dto/send-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { MessageQueryDto } from './dto/message-query.dto';
export declare class MessagesController {
    private readonly messagesService;
    constructor(messagesService: MessagesService);
    sendMessage(conversationId: string, dto: SendMessageDto, req: Request): Promise<{
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
    getMessages(conversationId: string, query: MessageQueryDto, req: Request): Promise<{
        data: any;
        meta: {
            page: number;
            limit: number;
            total: any;
            totalPages: number;
        };
    }>;
    searchMessages(conversationId: string, query: string, limit: number, req: Request): Promise<any>;
    getMessage(conversationId: string, messageId: string, req: Request): Promise<{
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
    updateMessage(conversationId: string, messageId: string, dto: UpdateMessageDto, req: Request): Promise<{
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
    deleteMessage(conversationId: string, messageId: string, forEveryone: boolean, req: Request): Promise<{
        message: string;
    }>;
}
