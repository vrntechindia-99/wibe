import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '@shared/database/redis.service';
import { PrismaService } from '@shared/database/prisma.service';
interface AuthenticatedSocket extends Socket {
    user?: {
        sub: string;
        deviceId: string;
    };
}
export declare class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly jwtService;
    private readonly configService;
    private readonly redis;
    private readonly prisma;
    server: Server;
    private readonly logger;
    constructor(jwtService: JwtService, configService: ConfigService, redis: RedisService, prisma: PrismaService);
    handleConnection(client: AuthenticatedSocket): Promise<void>;
    handleDisconnect(client: AuthenticatedSocket): Promise<void>;
    handleSubscribe(client: AuthenticatedSocket, data: {
        conversationIds?: string[];
        groupIds?: string[];
    }): Promise<{
        success: boolean;
    }>;
    handleUnsubscribe(client: AuthenticatedSocket, data: {
        conversationIds?: string[];
        groupIds?: string[];
    }): Promise<{
        success: boolean;
    }>;
    handleTypingStarted(client: AuthenticatedSocket, data: {
        conversationId: string;
    }): Promise<{
        success: boolean;
        error: string;
    } | {
        success: boolean;
        error?: undefined;
    }>;
    handleTypingStopped(client: AuthenticatedSocket, data: {
        conversationId: string;
    }): Promise<{
        success: boolean;
    }>;
    handleGroupTypingStarted(client: AuthenticatedSocket, data: {
        groupId: string;
    }): Promise<{
        success: boolean;
        error: string;
    } | {
        success: boolean;
        error?: undefined;
    }>;
    handleGroupTypingStopped(client: AuthenticatedSocket, data: {
        groupId: string;
    }): Promise<{
        success: boolean;
    }>;
    handleGroupMessageRead(client: AuthenticatedSocket, data: {
        groupId: string;
        messageId: string;
    }): Promise<{
        success: boolean;
        error: string;
    } | {
        success: boolean;
        error?: undefined;
    }>;
    handleGroupMessageDelivered(client: AuthenticatedSocket, data: {
        groupId: string;
        messageId: string;
    }): Promise<{
        success: boolean;
        error: string;
    } | {
        success: boolean;
        error?: undefined;
    }>;
    handlePing(): {
        success: boolean;
        pong: boolean;
    };
    private emitPresence;
    private extractToken;
    emitToConversation(conversationId: string, event: string, payload: any): Promise<void>;
    emitToUser(userId: string, event: string, payload: any): Promise<void>;
    broadcastPresence(userId: string, online: boolean): Promise<void>;
    emitGroupUpdated(groupId: string, payload: any): Promise<void>;
    emitMemberAdded(groupId: string, payload: any): Promise<void>;
    emitMemberRemoved(groupId: string, payload: any): Promise<void>;
    emitMemberLeft(groupId: string, payload: any): Promise<void>;
    emitMemberPromoted(groupId: string, payload: any): Promise<void>;
    emitMemberDemoted(groupId: string, payload: any): Promise<void>;
    emitGroupDeleted(groupId: string): Promise<void>;
}
export {};
