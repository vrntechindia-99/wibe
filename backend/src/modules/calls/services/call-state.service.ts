import { Injectable, Logger, NotFoundException, BadRequestException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '@shared/database/prisma.service';
import { RedisService } from '@shared/database/redis.service';
import { Prisma, CallType, CallStatus, GroupRole } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CallStateService {
  private readonly logger = new Logger(CallStateService.name);

  // Valid state transitions
  private readonly validTransitions: Record<CallStatus, CallStatus[]> = {
    [CallStatus.IDLE]: [CallStatus.INITIATING],
    [CallStatus.INITIATING]: [CallStatus.RINGING, CallStatus.FAILED, CallStatus.CANCELLED],
    [CallStatus.RINGING]: [CallStatus.ACCEPTED, CallStatus.DECLINED, CallStatus.MISSED, CallStatus.CANCELLED],
    [CallStatus.ACCEPTED]: [CallStatus.CONNECTING, CallStatus.FAILED],
    [CallStatus.CONNECTING]: [CallStatus.CONNECTED, CallStatus.FAILED],
    [CallStatus.CONNECTED]: [CallStatus.RECONNECTING, CallStatus.ENDING],
    [CallStatus.RECONNECTING]: [CallStatus.CONNECTED, CallStatus.FAILED],
    [CallStatus.ENDING]: [CallStatus.ENDED],
    [CallStatus.ENDED]: [],
    [CallStatus.FAILED]: [],
    [CallStatus.MISSED]: [],
    [CallStatus.DECLINED]: [],
    [CallStatus.CANCELLED]: [],
  };

  // Terminal states - no further transitions allowed
  private readonly terminalStates: CallStatus[] = [
    CallStatus.ENDED,
    CallStatus.FAILED,
    CallStatus.MISSED,
    CallStatus.DECLINED,
    CallStatus.CANCELLED,
  ];

  // Ringing timeout in milliseconds (configurable)
  private readonly ringingTimeoutMs = 45000; // 45 seconds

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  /**
   * Create a new call in INITIATING state
   */
  async createCall(
    callerId: string,
    conversationId: string,
    type: 'VOICE' | 'VIDEO',
    deviceId?: string,
  ) {
    // Verify conversation exists and caller is a member
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        members: {
          where: { leftAt: null },
          include: { user: true },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (conversation.type !== 'DIRECT') {
      throw new BadRequestException('Calls only supported in direct conversations');
    }

    // Find recipient
    const recipientMember = conversation.members.find(m => m.userId !== callerId);
    if (!recipientMember) {
      throw new NotFoundException('Recipient not found');
    }

    const recipientId = recipientMember.userId;

    // Check if caller is blocked by recipient
    const blocked = await this.prisma.blockedUser.findFirst({
      where: {
        OR: [
          { blockerId: recipientId, blockedId: callerId },
          { blockerId: callerId, blockedId: recipientId },
        ],
      },
    });

    if (blocked) {
      throw new ForbiddenException('Cannot call this user');
    }

    // Check if caller already has an active call
    const existingCall = await this.prisma.call.findFirst({
      where: {
        OR: [
          { callerId, status: { in: ['INITIATING', 'RINGING', 'ACCEPTED', 'CONNECTING', 'CONNECTED', 'RECONNECTING'] } },
          { recipientId: callerId, status: { in: ['INITIATING', 'RINGING', 'ACCEPTED', 'CONNECTING', 'CONNECTED', 'RECONNECTING'] } },
        ],
      },
    });

    if (existingCall) {
      throw new ConflictException('Already in a call');
    }

    // Create call in database
    const call = await this.prisma.call.create({
      data: {
        conversationId,
        callerId,
        recipientId,
        type: type as any,
        status: 'INITIATING',
        deviceId: deviceId,
      },
      include: {
        caller: { include: { profile: true } },
        recipient: { include: { profile: true } },
        conversation: true,
      },
    });

    // Store call state in Redis for quick access
    await this.redis.set(
      `call:${call.id}:state`,
      JSON.stringify({ status: 'INITIATING', callerId, recipientId }),
      3600,
    );

    return call;
  }

  /**
   * Transition call to RINGING state
   */
  async startRinging(callId: string) {
    await this.transitionState(callId, 'RINGING');

    // Set ringing timeout
    await this.redis.set(
      `call:${callId}:timeout`,
      'ringing',
      Math.ceil(this.ringingTimeoutMs / 1000),
    );
  }

  /**
   * Transition call state
   */
  async transitionState(callId: string, newStatus: string) {
    const call = await this.prisma.call.findUnique({
      where: { id: callId },
    });

    if (!call) {
      throw new NotFoundException('Call not found');
    }

    const currentStatus = call.status as any;
    const newState = newState as any;

    if (this.terminalStates.includes(currentStatus)) {
      throw new BadRequestException(`Cannot transition from terminal state: ${currentStatus}`);
    }

    const allowed = this.validTransitions[currentStatus] || [];
    if (!allowed.includes(newState)) {
      throw new BadRequestException(`Invalid transition from ${currentStatus} to ${newState}`);
    }

    // Update in database
    const updatedCall = await this.prisma.call.update({
      where: { id: callId },
      data: {
        status: newState,
        updatedAt: new Date(),
      },
    });

    // Update Redis cache
    await this.redis.set(
      `call:${callId}:state`,
      JSON.stringify({ status: newState, updatedAt: new Date().toISOString() }),
      3600,
    );

    return updatedCall;
  }

  /**
   * Accept an incoming call
   */
  async acceptCall(callId: string, userId: string) {
    const call = await this.prisma.call.findUnique({
      where: { id: callId },
    });

    if (!call) {
      throw new NotFoundException('Call not found');
    }

    if (call.recipientId !== userId) {
      throw new ForbiddenException('Not authorized to accept this call');
    }

    if (call.status !== 'RINGING') {
      throw new BadRequestException('Call is not in ringing state');
    }

    // Transition to ACCEPTED
    await this.transitionState(callId, 'ACCEPTED');

    // Clear ringing timeout
    await this.redis.del(`call:${callId}:timeout`);

    // Update with accepted timestamp
    await this.prisma.call.update({
      where: { id: callId },
      data: {
        status: 'ACCEPTED',
        acceptedAt: new Date(),
      },
    });

    return call;
  }

  /**
   * Decline an incoming call
   */
  async declineCall(callId: string, userId: string) {
    const call = await this.prisma.call.findUnique({
      where: { id: callId },
    });

    if (!call) {
      throw new NotFoundException('Call not found');
    }

    if (call.recipientId !== userId) {
      throw new ForbiddenException('Not authorized to decline this call');
    }

    if (call.status !== 'RINGING') {
      throw new BadRequestException('Call is not in ringing state');
    }

    await this.transitionState(callId, 'DECLINED');
    await this.redis.del(`call:${callId}:timeout`);

    await this.prisma.call.update({
      where: { id: callId },
      data: {
        status: 'DECLINED',
        endedAt: new Date(),
        endReason: 'DECLINED',
      },
    });

    return call;
  }

  /**
   * Cancel an outgoing call
   */
  async cancelCall(callId: string, userId: string) {
    const call = await this.prisma.call.findUnique({
      where: { id: callId },
    });

    if (!call) {
      throw new NotFoundException('Call not found');
    }

    if (call.callerId !== userId) {
      throw new ForbiddenException('Not authorized to cancel this call');
    }

    if (call.status !== 'INITIATING' && call.status !== 'RINGING') {
      throw new BadRequestException('Call cannot be cancelled');
    }

    await this.transitionState(callId, 'CANCELLED');
    await this.redis.del(`call:${callId}:timeout`);

    await this.prisma.call.update({
      where: { id: callId },
      data: {
        status: 'CANCELLED',
        endedAt: new Date(),
        endReason: 'CANCELLED',
      },
    });

    return call;
  }

  /**
   * End an active call
   */
  async endCall(callId: string, userId: string) {
    const call = await this.prisma.call.findUnique({
      where: { id: callId },
    });

    if (!call) {
      throw new NotFoundException('Call not found');
    }

    if (call.callerId !== userId && call.recipientId !== userId) {
      throw new ForbiddenException('Not a participant in this call');
    }

    if (!['CONNECTING', 'CONNECTED', 'RECONNECTING'].includes(call.status)) {
      throw new BadRequestException('Call is not in an active state');
    }

    await this.transitionState(callId, 'ENDING');

    const endedAt = new Date();
    const duration = call.connectedAt
      ? Math.floor((endedAt.getTime() - call.connectedAt.getTime()) / 1000)
      : 0;

    await this.prisma.call.update({
      where: { id: callId },
      data: {
        status: 'ENDED',
        endedAt,
        durationSeconds: duration,
        endReason: 'USER_ENDED',
      },
    });

    return call;
  }

  /**
   * Handle missed call (ringing timeout)
   */
  async handleMissedCall(callId: string) {
    const call = await this.prisma.call.findUnique({
      where: { id: callId },
    });

    if (!call || call.status !== 'RINGING') {
      return;
    }

    await this.transitionState(callId, 'MISSED');
    await this.redis.del(`call:${callId}:timeout`);

    await this.prisma.call.update({
      where: { id: callId },
      data: {
        status: 'MISSED',
        endedAt: new Date(),
        endReason: 'MISSED',
      },
    });

    // Notify via WebSocket
    await this.redis.publish(`user:${call.recipientId}:calls`, JSON.stringify({
      type: 'call_missed',
      callId,
      callerId: call.callerId,
    }));

    // Notify caller
    await this.redis.publish(`user:${call.callerId}:calls`, JSON.stringify({
      type: 'call_missed',
      callId,
      recipientId: call.recipientId,
    }));
  }

  /**
   * Handle call failure
   */
  async handleCallFailure(callId: string, reason: string) {
    const call = await this.prisma.call.findUnique({
      where: { id: callId },
    });

    if (!call) {
      return;
    }

    if (this.terminalStates.includes(call.status as any)) {
      return;
    }

    await this.transitionState(callId, 'FAILED');
    await this.redis.del(`call:${callId}:timeout`);

    await this.prisma.call.update({
      where: { id: callId },
      data: {
        status: 'FAILED',
        endedAt: new Date(),
        endReason: reason.toUpperCase() as any,
      },
    });
  }

  /**
   * Update call to CONNECTED state
   */
  async markConnected(callId: string) {
    const call = await this.prisma.call.findUnique({
      where: { id: callId },
    });

    if (!call) {
      throw new NotFoundException('Call not found');
    }

    if (call.status !== 'CONNECTING' && call.status !== 'RECONNECTING') {
      throw new BadRequestException('Call is not in connecting state');
    }

    await this.transitionState(callId, 'CONNECTED');

    await this.prisma.call.update({
      where: { id: callId },
      data: {
        status: 'CONNECTED',
        connectedAt: new Date(),
      },
    });
  }

  /**
   * Handle reconnection
   */
  async handleReconnecting(callId: string) {
    const call = await this.prisma.call.findUnique({
      where: { id: callId },
    });

    if (!call || call.status !== 'CONNECTED') {
      return;
    }

    await this.transitionState(callId, 'RECONNECTING');
  }

  /**
   * Get call state
   */
  async getCallState(callId: string) {
    const cached = await this.redis.get(`call:${callId}:state`);
    if (cached) {
      return JSON.parse(cached);
    }

    const call = await this.prisma.call.findUnique({
      where: { id: callId },
      select: { id: true, status: true, callerId: true, recipientId: true },
    });

    return call;
  }

  /**
   * Get active call for user
   */
  async getActiveCall(userId: string) {
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
      orderBy: { createdAt: 'desc' },
    });

    return call;
  }

  /**
   * Store WebRTC signaling data
   */
  async storeOffer(callId: string, userId: string, sdp: string) {
    await this.redis.set(
      `call:${callId}:offer:${userId}`,
      sdp,
      300, // 5 minutes
    );
  }

  async getOffer(callId: string, userId: string): Promise<string | null> {
    return this.redis.get(`call:${callId}:offer:${userId}`);
  }

  async storeAnswer(callId: string, userId: string, sdp: string) {
    await this.redis.set(
      `call:${callId}:answer:${userId}`,
      sdp,
      300,
    );
  }

  async getAnswer(callId: string, userId: string): Promise<string | null> {
    return this.redis.get(`call:${callId}:answer:${userId}`);
  }

  async storeIceCandidate(callId: string, userId: string, candidate: any) {
    const key = `call:${callId}:ice:${userId}`;
    const existing = await this.redis.get(key);
    const candidates = existing ? JSON.parse(existing) : [];
    candidates.push(candidate);
    await this.redis.set(key, JSON.stringify(candidates), 300);
  }

  async getIceCandidates(callId: string, userId: string): Promise<any[]> {
    const key = `call:${callId}:ice:${userId}`;
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : [];
  }

  async clearSignalingData(callId: string) {
    const keys = await this.redis.keys(`call:${callId}:*`);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}