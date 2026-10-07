import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

import { WsJwtGuard } from '@shared/guards/ws-jwt.guard';
import { UseGuards } from '@nestjs/common';
import { RedisService } from '@shared/database/redis.service';
import { PrismaService } from '@shared/database/prisma.service';

interface AuthenticatedSocket extends Socket {
  user?: { sub: string; deviceId: string };
}

@WebSocketGateway({
  namespace: '/',
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(RealtimeGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly redis: RedisService,
    private readonly prisma: PrismaService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token = this.extractToken(client);
      if (!token) {
        this.logger.warn(`Connection rejected: no token - ${client.id}`);
        client.disconnect();
        return;
      }

      const secret = this.configService.get<string>('JWT_ACCESS_SECRET');
      const payload = await this.jwtService.verifyAsync(token, { secret });

      client.user = { sub: payload.sub, deviceId: payload.deviceId };

      // Store connection mapping
      await this.redis.setUserOnline(payload.sub, payload.deviceId);

      // Join user's personal room for notifications
      client.join(`user:${payload.sub}`);

      // Join conversation rooms
      const memberships = await this.prisma.conversationMember.findMany({
        where: { userId: payload.sub, leftAt: null },
        select: { conversationId: true },
      });

      for (const membership of memberships) {
        client.join(`conversation:${membership.conversationId}`);
      }

      // Join group rooms
      const groupMemberships = await this.prisma.groupMember.findMany({
        where: { userId: payload.sub, leftAt: null },
        select: { groupId: true },
      });

      for (const membership of groupMemberships) {
        client.join(`group:${membership.groupId}`);
      }

      // Emit presence
      await this.emitPresence(payload.sub, true);

      this.logger.log(`Client connected: ${client.id} (user: ${payload.sub})`);
    } catch (error) {
      this.logger.warn(`Connection rejected: ${error.message} - ${client.id}`);
      client.disconnect();
    }
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    if (client.user) {
      await this.redis.setUserOffline(client.user.sub, client.user.deviceId);

      // Check if user has other active connections
      const devices = await this.redis.getUserDevices(client.user.sub);
      if (Object.keys(devices).length === 0) {
        await this.emitPresence(client.user.sub, false);
      }
    }
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('subscribe')
  @UseGuards(WsJwtGuard)
  async handleSubscribe(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationIds?: string[]; groupIds?: string[] },
  ) {
    const userId = client.user!.sub;

    if (data.conversationIds && Array.isArray(data.conversationIds)) {
      for (const conversationId of data.conversationIds) {
        const membership = await this.prisma.conversationMember.findUnique({
          where: { conversationId_userId: { conversationId, userId } },
        });

        if (membership && !membership.leftAt) {
          client.join(`conversation:${conversationId}`);
        }
      }
    }

    if (data.groupIds && Array.isArray(data.groupIds)) {
      for (const groupId of data.groupIds) {
        const membership = await this.prisma.groupMember.findUnique({
          where: { groupId_userId: { groupId, userId } },
        });

        if (membership && !membership.leftAt) {
          client.join(`group:${groupId}`);
        }
      }
    }

    return { success: true };
  }

  @SubscribeMessage('unsubscribe')
  @UseGuards(WsJwtGuard)
  async handleUnsubscribe(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationIds?: string[]; groupIds?: string[] },
  ) {
    if (data.conversationIds && Array.isArray(data.conversationIds)) {
      for (const conversationId of data.conversationIds) {
        client.leave(`conversation:${conversationId}`);
      }
    }

    if (data.groupIds && Array.isArray(data.groupIds)) {
      for (const groupId of data.groupIds) {
        client.leave(`group:${groupId}`);
      }
    }

    return { success: true };
  }

  @SubscribeMessage('typing_started')
  @UseGuards(WsJwtGuard)
  async handleTypingStarted(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string },
  ) {
    const { conversationId } = data;
    const userId = client.user!.sub;

    // Verify membership
    const membership = await this.prisma.conversationMember.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });

    if (!membership || membership.leftAt) {
      return { success: false, error: 'Not a member' };
    }

    // Set typing in Redis with TTL
    await this.redis.setTyping(userId, conversationId);

    // Broadcast to conversation (except sender)
    this.server.to(`conversation:${conversationId}`).emit('typing_started', {
      conversationId,
      userId,
    });

    return { success: true };
  }

  @SubscribeMessage('typing_stopped')
  @UseGuards(WsJwtGuard)
  async handleTypingStopped(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string },
  ) {
    const { conversationId } = data;
    const userId = client.user!.sub;

    await this.redis.removeTyping(userId, conversationId);

    this.server.to(`conversation:${conversationId}`).emit('typing_stopped', {
      conversationId,
      userId,
    });

    return { success: true };
  }

  @SubscribeMessage('group_typing_started')
  @UseGuards(WsJwtGuard)
  async handleGroupTypingStarted(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { groupId: string },
  ) {
    const { groupId } = data;
    const userId = client.user!.sub;

    const membership = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });

    if (!membership || membership.leftAt) {
      return { success: false, error: 'Not a member' };
    }

    await this.redis.setTyping(userId, `group:${groupId}`);

    this.server.to(`group:${groupId}`).emit('group_typing_started', {
      groupId,
      userId,
    });

    return { success: true };
  }

  @SubscribeMessage('group_typing_stopped')
  @UseGuards(WsJwtGuard)
  async handleGroupTypingStopped(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { groupId: string },
  ) {
    const { groupId } = data;
    const userId = client.user!.sub;

    await this.redis.removeTyping(userId, `group:${groupId}`);

    this.server.to(`group:${groupId}`).emit('group_typing_stopped', {
      groupId,
      userId,
    });

    return { success: true };
  }

  @SubscribeMessage('group_message_read')
  @UseGuards(WsJwtGuard)
  async handleGroupMessageRead(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { groupId: string; messageId: string },
  ) {
    const { groupId, messageId } = data;
    const userId = client.user!.sub;

    const membership = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });

    if (!membership || membership.leftAt) {
      return { success: false, error: 'Not a member' };
    }

    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      include: { conversation: true },
    });

    if (!group) {
      return { success: false, error: 'Group not found' };
    }

    // Update read cursor in conversation member
    await this.prisma.conversationMember.update({
      where: { conversationId_userId: { conversationId: group.conversationId, userId } },
      data: { lastReadMessageId: messageId, unreadCount: 0 },
    });

    // Create read receipt
    await this.prisma.messageReadReceipt.upsert({
      where: { messageId_userId: { messageId, userId } },
      create: { messageId, userId },
      update: { readAt: new Date() },
    });

    this.server.to(`group:${groupId}`).emit('group_message_read', {
      groupId,
      messageId,
      userId,
    });

    return { success: true };
  }

  @SubscribeMessage('group_message_delivered')
  @UseGuards(WsJwtGuard)
  async handleGroupMessageDelivered(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { groupId: string; messageId: string },
  ) {
    const { groupId, messageId } = data;
    const userId = client.user!.sub;

    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      include: { conversation: true },
    });

    if (!group) {
      return { success: false, error: 'Group not found' };
    }

    await this.prisma.message.update({
      where: { id: messageId },
      data: { status: 'DELIVERED' },
    });

    this.server.to(`group:${groupId}`).emit('group_message_delivered', {
      groupId,
      messageId,
      userId,
    });

    return { success: true };
  }

  @SubscribeMessage('ping')
  @UseGuards(WsJwtGuard)
  handlePing() {
    return { success: true, pong: true };
  }

  @SubscribeMessage('message_reaction_added')
  @UseGuards(WsJwtGuard)
  async handleMessageReactionAdded(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { messageId: string; emoji: string },
  ) {
    const { messageId, emoji } = data;
    const userId = client.user!.sub;

    // This is handled by REST API, but we can broadcast via WebSocket
    // Client can emit this to trigger real-time update
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      select: { conversationId: true },
    });

    if (message) {
      this.server.to(`conversation:${message.conversationId}`).emit('reaction_added', {
        messageId,
        emoji,
        userId,
      });
    }

    return { success: true };
  }

  @SubscribeMessage('message_reaction_removed')
  @UseGuards(WsJwtGuard)
  async handleMessageReactionRemoved(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { messageId: string; emoji: string },
  ) {
    const { messageId, emoji } = data;
    const userId = client.user!.sub;

    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      select: { conversationId: true },
    });

    if (message) {
      this.server.to(`conversation:${message.conversationId}`).emit('reaction_removed', {
        messageId,
        emoji,
        userId,
      });
    }

    return { success: true };
  }

  @SubscribeMessage('status_subscribe')
  @UseGuards(WsJwtGuard)
  async handleStatusSubscribe(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { userIds?: string[] },
  ) {
    // Subscribe to status events for specific users
    // For now, join a general status room
    client.join('status_updates');
    return { success: true };
  }

  @SubscribeMessage('status_unsubscribe')
  @UseGuards(WsJwtGuard)
  async handleStatusUnsubscribe(
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    client.leave('status_updates');
    return { success: true };
  }

  @SubscribeMessage('ping')
  @UseGuards(WsJwtGuard)
  handlePing() {
    return { success: true, pong: true };
  }

  private async emitPresence(userId: string, online: boolean) {
    const event = {
      type: online ? 'user_online' : 'user_offline',
      payload: { userId, timestamp: new Date().toISOString() },
    };

    // Broadcast to all users who have this user in their contacts/conversations
    // For simplicity, broadcast to all connected clients
    this.server.emit('presence', event);

    // Also publish to Redis for other gateway instances
    await this.redis.publish('presence', JSON.stringify(event));
  }

  private extractToken(client: AuthenticatedSocket): string | undefined {
    const auth = client.handshake.auth;
    if (auth?.token) return auth.token;

    const query = client.handshake.query;
    if (query?.token) return query.token as string;

    const headers = client.handshake.headers;
    if (headers?.authorization) {
      const [type, token] = headers.authorization.split(' ');
      if (type === 'Bearer') return token;
    }

    return undefined;
  }

  // Public methods for other services to emit events
  async emitToConversation(conversationId: string, event: string, payload: any) {
    this.server.to(`conversation:${conversationId}`).emit(event, payload);
  }

  async emitToUser(userId: string, event: string, payload: any) {
    this.server.to(`user:${userId}`).emit(event, payload);
  }

  async broadcastPresence(userId: string, online: boolean) {
    await this.emitPresence(userId, online);
  }

  // Group event emitters
  async emitGroupUpdated(groupId: string, payload: any) {
    this.server.to(`group:${groupId}`).emit('group_updated', { groupId, ...payload });
  }

  async emitMemberAdded(groupId: string, payload: any) {
    this.server.to(`group:${groupId}`).emit('member_added', { groupId, ...payload });
  }

  async emitMemberRemoved(groupId: string, payload: any) {
    this.server.to(`group:${groupId}`).emit('member_removed', { groupId, ...payload });
  }

  async emitMemberLeft(groupId: string, payload: any) {
    this.server.to(`group:${groupId}`).emit('member_left', { groupId, ...payload });
  }

  async emitMemberPromoted(groupId: string, payload: any) {
    this.server.to(`group:${groupId}`).emit('member_promoted', { groupId, ...payload });
  }

  async emitMemberDemoted(groupId: string, payload: any) {
    this.server.to(`group:${groupId}`).emit('member_demoted', { groupId, ...payload });
  }

  async emitGroupDeleted(groupId: string) {
    this.server.to(`group:${groupId}`).emit('group_deleted', { groupId });
  }
}