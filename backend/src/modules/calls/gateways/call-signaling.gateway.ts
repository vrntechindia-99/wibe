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
import { UseGuards } from '@nestjs/common';

import { WsJwtGuard } from '@shared/guards/ws-jwt.guard';
import { RedisService } from '@shared/database/redis.service';
import { PrismaService } from '@shared/database/prisma.service';

interface AuthenticatedSocket extends Socket {
  user?: { sub: string; deviceId: string };
}

@WebSocketGateway({
  namespace: '/calls',
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class CallSignalingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(CallSignalingGateway.name);

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
        this.logger.warn(`Call connection rejected: no token - ${client.id}`);
        client.disconnect();
        return;
      }

      const secret = this.configService.get<string>('JWT_ACCESS_SECRET');
      const payload = await this.jwtService.verifyAsync(token, { secret });

      client.user = { sub: payload.sub, deviceId: payload.deviceId };

      // Store connection mapping
      await this.redis.setUserOnline(payload.sub, payload.deviceId);

      // Join user's personal room for call notifications
      client.join(`user:${payload.sub}:calls`);

      // Join conversation rooms for calls
      const memberships = await this.prisma.conversationMember.findMany({
        where: { userId: payload.sub, leftAt: null },
        select: { conversationId: true },
      });

      for (const membership of memberships) {
        client.join(`conversation:${membership.conversationId}:calls`);
      }

      // Join group rooms for calls
      const groupMemberships = await this.prisma.groupMember.findMany({
        where: { userId: payload.sub, leftAt: null },
        select: { groupId: true },
      });

      for (const membership of groupMemberships) {
        client.join(`group:${membership.groupId}:calls`);
      }

      this.logger.log(`Call client connected: ${client.id} (user: ${payload.sub})`);
    } catch (error) {
      this.logger.warn(`Call connection rejected: ${error.message} - ${client.id}`);
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
    this.logger.log(`Call client disconnected: ${client.id}`);
  }

  @SubscribeMessage('call_start')
  @UseGuards(WsJwtGuard)
  async handleStartCall(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string; type: 'VOICE' | 'VIDEO'; deviceId?: string },
  ) {
    const userId = client.user!.sub;

    // This will be handled by REST API, but we can validate here
    const call = await this.prisma.call.findFirst({
      where: {
        OR: [
          { callerId: userId },
          { recipientId: userId },
        ],
        status: {
          in: ['INITIATING', 'RINGING', 'ACCEPTED', 'CONNECTING', 'CONNECTED', 'RECONNECTING'],
        },
      },
    });

    if (data.conversationId) {
      // Check if user is member of conversation
      const membership = await this.prisma.conversationMember.findUnique({
        where: { conversationId_userId: { conversationId: data.conversationId, userId } },
      });

      if (!membership || membership.leftAt) {
        return { success: false, error: 'Not a member of this conversation' };
      }
    }

    // Return success - actual call creation is via REST API
    return { success: true };
  }

  @SubscribeMessage('call_accept')
  @UseGuards(WsJwtGuard)
  async handleAcceptCall(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { callId: string },
  ) {
    const userId = client.user!.sub;

    // The actual acceptance is via REST API
    // This is just for WebSocket acknowledgment
    return { success: true };
  }

  @SubscribeMessage('call_decline')
  @UseGuards(WsJwtGuard)
  async handleDeclineCall(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { callId: string },
  ) {
    return { success: true };
  }

  @SubscribeMessage('call_end')
  @UseGuards(WsJwtGuard)
  async handleEndCall(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { callId: string },
  ) {
    return { success: true };
  }

  @SubscribeMessage('call_offer')
  @UseGuards(WsJwtGuard)
  async handleOffer(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { callId: string; sdp: string },
  ) {
    const userId = client.user!.sub;

    // Forward offer to other participant
    this.server.to(`user:${data.callId}:calls`).emit('call_offer', {
      callId: data.callId,
      from: userId,
      sdp: data.sdp,
    });

    return { success: true };
  }

  @SubscribeMessage('call_answer')
  @UseGuards(WsJwtGuard)
  async handleAnswer(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { callId: string; sdp: string },
  ) {
    const userId = client.user!.sub;

    // Forward answer to other participant
    this.server.to(`user:${data.callId}:calls`).emit('call_answer', {
      callId: data.callId,
      from: userId,
      sdp: data.sdp,
    });

    return { success: true };
  }

  @SubscribeMessage('ice_candidate')
  @UseGuards(WsJwtGuard)
  async handleIceCandidate(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { callId: string; candidate: any; sdpMLineIndex?: number; sdpMid?: string },
  ) {
    const userId = client.user!.sub;

    // Forward ICE candidate to other participant
    this.server.to(`user:${data.callId}:calls`).emit('ice_candidate', {
      callId: data.callId,
      from: userId,
      candidate: data.candidate,
      sdpMLineIndex: data.sdpMLineIndex,
      sdpMid: data.sdpMid,
    });

    return { success: true };
  }

  @SubscribeMessage('call_subscribe')
  @UseGuards(WsJwtGuard)
  async handleSubscribe(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { callIds?: string[]; conversationIds?: string[] },
  ) {
    const userId = client.user!.sub;

    if (data.callIds && Array.isArray(data.callIds)) {
      for (const callId of data.callIds) {
        // Verify user is participant
        const call = await this.prisma.call.findUnique({
          where: { id: callId },
          select: { callerId: true, recipientId: true },
        });

        if (call && (call.callerId === userId || call.recipientId === userId)) {
          client.join(`call:${callId}:signaling`);
        }
      }
    }

    if (data.conversationIds && Array.isArray(data.conversationIds)) {
      for (const conversationId of data.conversationIds) {
        const membership = await this.prisma.conversationMember.findUnique({
          where: { conversationId_userId: { conversationId, userId } },
        });

        if (membership && !membership.leftAt) {
          client.join(`conversation:${conversationId}:calls`);
        }
      }
    }

    return { success: true };
  }

  @SubscribeMessage('call_unsubscribe')
  @UseGuards(WsJwtGuard)
  async handleUnsubscribe(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { callIds?: string[]; conversationIds?: string[] },
  ) {
    if (data.callIds && Array.isArray(data.callIds)) {
      for (const callId of data.callIds) {
        client.leave(`call:${callId}:signaling`);
      }
    }

    if (data.conversationIds && Array.isArray(data.conversationIds)) {
      for (const conversationId of data.conversationIds) {
        client.leave(`conversation:${conversationId}:calls`);
      }
    }

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

    this.server.emit('presence', event);
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

  // Public methods for services to emit events
  async emitToCall(callId: string, event: string, payload: any) {
    this.server.to(`call:${callId}:signaling`).emit(event, payload);
  }

  async emitToUser(userId: string, event: string, payload: any) {
    this.server.to(`user:${userId}:calls`).emit(event, payload);
  }
}