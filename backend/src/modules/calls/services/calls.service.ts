import { Injectable, Logger, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@shared/database/prisma.service';
import { RedisService } from '@shared/database/redis.service';
import { CallStateService } from './call-state.service';
import { Prisma, CallType, CallStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

import { StartCallDto } from '../dto/start-call.dto';
import { CallActionDto } from '../dto/call-action.dto';
import { CallOfferDto } from '../dto/call-offer.dto';
import { CallAnswerDto } from '../dto/call-answer.dto';
import { IceCandidateDto } from '../dto/ice-candidate.dto';
import { CallHistoryQueryDto, CallHistorySortBy, SortOrder } from '../dto/call-history.dto';

@Injectable()
export class CallsService {
  private readonly logger = new Logger(CallsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly callStateService: CallStateService,
  ) {}

  /**
   * Start a new call
   */
  async startCall(userId: string, dto: StartCallDto, deviceId?: string) {
    // Check for existing active call
    const activeCall = await this.callStateService.getActiveCall(userId);
    if (activeCall) {
      throw new BadRequestException('Already in an active call');
    }

    // Create call
    const call = await this.callStateService.createCall(
      userId,
      dto.conversationId,
      dto.type,
      deviceId,
    );

    // Start ringing
    await this.callStateService.startRinging(call.id);

    // Emit call_started event to caller
    await this.emitCallEvent(call.id, 'call_started', { call: this.formatCall(call) });

    // Emit call_ringing to recipient
    await this.redis.publish(`user:${call.recipientId}:calls`, JSON.stringify({
      type: 'call_ringing',
      call: this.formatCall(call),
    }));

    return this.formatCall(call);
  }

  /**
   * Accept an incoming call
   */
  async acceptCall(userId: string, dto: CallActionDto) {
    const call = await this.callStateService.acceptCall(dto.callId, userId);
    if (!call) {
      throw new NotFoundException('Call not found');
    }

    // Notify caller
    await this.redis.publish(`user:${call.callerId}:calls`, JSON.stringify({
      type: 'call_accepted',
      callId: call.id,
    }));

    return this.formatCall(call);
  }

  /**
   * Decline an incoming call
   */
  async declineCall(userId: string, dto: CallActionDto) {
    const call = await this.callStateService.declineCall(dto.callId, userId);
    if (!call) {
      throw new NotFoundException('Call not found');
    }

    // Notify caller
    await this.redis.publish(`user:${call.callerId}:calls`, JSON.stringify({
      type: 'call_declined',
      callId: call.id,
    }));

    return { message: 'Call declined' };
  }

  /**
   * Cancel an outgoing call
   */
  async cancelCall(userId: string, dto: CallActionDto) {
    const call = await this.callStateService.cancelCall(dto.callId, userId);
    if (!call) {
      throw new NotFoundException('Call not found');
    }

    // Notify recipient
    await this.redis.publish(`user:${call.recipientId}:calls`, JSON.stringify({
      type: 'call_cancelled',
      callId: call.id,
    }));

    return { message: 'Call cancelled' };
  }

  /**
   * End an active call
   */
  async endCall(userId: string, dto: CallActionDto) {
    const call = await this.callStateService.endCall(dto.callId, userId);
    if (!call) {
      throw new NotFoundException('Call not found');
    }

    // Notify other participant
    const otherId = call.callerId === userId ? call.recipientId : call.callerId;
    await this.redis.publish(`user:${otherId}:calls`, JSON.stringify({
      type: 'call_ended',
      callId: call.id,
      endedBy: userId,
    }));

    return { message: 'Call ended' };
  }

  /**
   * WebRTC Signaling - Offer
   */
  async sendOffer(userId: string, dto: CallOfferDto) {
    const call = await this.prisma.call.findUnique({
      where: { id: dto.callId },
    });

    if (!call) {
      throw new NotFoundException('Call not found');
    }

    if (call.callerId !== userId && call.recipientId !== userId) {
      throw new ForbiddenException('Not a participant in this call');
    }

    if (!['INITIATING', 'RINGING', 'ACCEPTED', 'CONNECTING'].includes(call.status)) {
      throw new BadRequestException('Call is not in a state to send offer');
    }

    // Store offer
    await this.callStateService.storeOffer(dto.callId, userId, dto.sdp);

    // Forward to other participant
    const otherId = call.callerId === userId ? call.recipientId : call.callerId;
    await this.redis.publish(`user:${otherId}:calls`, JSON.stringify({
      type: 'call_offer',
      callId: dto.callId,
      from: userId,
      sdp: dto.sdp,
    }));

    return { message: 'Offer sent' };
  }

  /**
   * WebRTC Signaling - Answer
   */
  async sendAnswer(userId: string, dto: CallAnswerDto) {
    const call = await this.prisma.call.findUnique({
      where: { id: dto.callId },
    });

    if (!call) {
      throw new NotFoundException('Call not found');
    }

    if (call.callerId !== userId && call.recipientId !== userId) {
      throw new ForbiddenException('Not a participant in this call');
    }

    // Store answer
    await this.callStateService.storeAnswer(dto.callId, userId, dto.sdp);

    // Forward to other participant
    const otherId = call.callerId === userId ? call.recipientId : call.callerId;
    await this.redis.publish(`user:${otherId}:calls`, JSON.stringify({
      type: 'call_answer',
      callId: dto.callId,
      from: userId,
      sdp: dto.sdp,
    }));

    return { message: 'Answer sent' };
  }

  /**
   * WebRTC Signaling - ICE Candidate
   */
  async sendIceCandidate(userId: string, dto: IceCandidateDto) {
    const call = await this.prisma.call.findUnique({
      where: { id: dto.callId },
    });

    if (!call) {
      throw new NotFoundException('Call not found');
    }

    if (call.callerId !== userId && call.recipientId !== userId) {
      throw new ForbiddenException('Not a participant in this call');
    }

    if (!['ACCEPTED', 'CONNECTING', 'CONNECTED', 'RECONNECTING'].includes(call.status)) {
      throw new BadRequestException('Call is not in a state to exchange ICE candidates');
    }

    // Store candidate
    await this.callStateService.storeIceCandidate(dto.callId, userId, {
      candidate: dto.candidate,
      sdpMLineIndex: dto.sdpMLineIndex,
      sdpMid: dto.sdpMid,
    });

    // Forward to other participant
    const otherId = call.callerId === userId ? call.recipientId : call.callerId;
    await this.redis.publish(`user:${otherId}:calls`, JSON.stringify({
      type: 'ice_candidate',
      callId: dto.callId,
      from: userId,
      candidate: dto.candidate,
      sdpMLineIndex: dto.sdpMLineIndex,
      sdpMid: dto.sdpMid,
    }));

    return { message: 'ICE candidate sent' };
  }

  /**
   * Get call history
   */
  async getCallHistory(userId: string, query: CallHistoryQueryDto) {
    const { page = 1, limit = 20, sortBy = CallHistorySortBy.STARTED_AT, sortOrder = SortOrder.DESC } = query;

    const where: Prisma.CallWhereInput = {
      OR: [
        { callerId: userId },
        { recipientId: userId },
      ],
      status: {
        in: ['ENDED', 'MISSED', 'DECLINED', 'CANCELLED', 'FAILED'],
      },
    };

    const orderBy: Prisma.CallOrderByWithRelationInput = {};
    if (sortBy === CallHistorySortBy.DURATION) {
      orderBy.durationSeconds = sortOrder;
    } else {
      orderBy[sortBy] = sortOrder;
    }

    const [calls, total] = await Promise.all([
      this.prisma.call.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          caller: { include: { profile: true } },
          recipient: { include: { profile: true } },
          conversation: true,
        },
      }),
      this.prisma.call.count({ where }),
    );

    return {
      data: calls.map(c => this.formatCall(c)),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get call details
   */
  async getCall(callId: string, userId: string) {
    const call = await this.prisma.call.findUnique({
      where: { id: callId },
      include: {
        caller: { include: { profile: true } },
        recipient: { include: { profile: true } },
        conversation: true,
      },
    });

    if (!call) {
      throw new NotFoundException('Call not found');
    }

    if (call.callerId !== userId && call.recipientId !== userId) {
      throw new ForbiddenException('Not a participant in this call');
    }

    return this.formatCall(call);
  }

  /**
   * Get active call for user
   */
  async getActiveCall(userId: string) {
    const call = await this.callStateService.getActiveCall(userId);
    if (!call) {
      return null;
    }
    return this.formatCall(call);
  }

  /**
   * Get TURN/STUN configuration
   */
  getIceServers() {
    const turnUrl = process.env.TURN_URL;
    const turnUsername = process.env.TURN_USERNAME;
    const turnPassword = process.env.TURN_PASSWORD;

    const servers = [];

    // Add STUN servers
    servers.push({ urls: 'stun:stun.l.google.com:19302' });
    servers.push({ urls: 'stun:stun1.l.google.com:19302' });

    // Add TURN server if configured
    if (turnUrl && turnUsername && turnPassword) {
      servers.push({
        urls: turnUrl,
        username: turnUsername,
        credential: turnPassword,
      });
    }

    return { iceServers: servers };
  }

  /**
   * Format call for API response
   */
  private formatCall(call: any) {
    const duration = call.connectedAt && call.endedAt
      ? Math.floor((call.endedAt.getTime() - call.connectedAt.getTime()) / 1000)
      : call.durationSeconds || 0;

    return {
      id: call.id,
      conversationId: call.conversationId,
      type: call.type,
      status: call.status,
      callerId: call.callerId,
      recipientId: call.recipientId,
      deviceId: call.deviceId,
      durationSeconds: duration,
      startedAt: call.startedAt,
      connectedAt: call.connectedAt,
      endedAt: call.endedAt,
      endReason: call.endReason,
      createdAt: call.createdAt,
      updatedAt: call.updatedAt,
      caller: call.caller ? {
        id: call.caller.id,
        displayName: call.caller.profile?.displayName,
        avatarUrl: call.caller.profile?.avatarUrl,
      } : undefined,
      recipient: call.recipient ? {
        id: call.recipient.id,
        displayName: call.recipient.profile?.displayName,
        avatarUrl: call.recipient.profile?.avatarUrl,
      } : undefined,
      conversation: call.conversation ? {
        id: call.conversation.id,
        type: call.conversation.type,
      } : undefined,
    };
  }

  /**
   * Emit call event via Redis for WebSocket broadcasting
   */
  private async emitCallEvent(callId: string, eventType: string, payload: any) {
    const call = await this.prisma.call.findUnique({
      where: { id: callId },
      select: { callerId: true, recipientId: true, conversationId: true },
    });

    if (!call) return;

    const event = { type: eventType, ...payload };

    // Send to both participants
    await Promise.all([
      this.redis.publish(`user:${call.callerId}:calls`, JSON.stringify(event)),
      this.redis.publish(`user:${call.recipientId}:calls`, JSON.stringify(event)),
    ]);
  }
}