import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Request } from 'express';

import { CallsService } from './services/calls.service';
import { CallStateService } from './services/call-state.service';
import { JwtAuthGuard } from '@shared/guards/jwt-auth.guard';
import { StartCallDto } from './dto/start-call.dto';
import { CallActionDto } from './dto/call-action.dto';
import { CallOfferDto } from './dto/call-offer.dto';
import { CallAnswerDto } from './dto/call-answer.dto';
import { IceCandidateDto } from './dto/ice-candidate.dto';
import { CallHistoryQueryDto } from './dto/call-history.dto';

@ApiTags('calls')
@Controller('calls')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CallsController {
  constructor(
    private readonly callsService: CallsService,
    private readonly callStateService: CallStateService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Start a new call' })
  @ApiResponse({ status: 201, description: 'Call initiated' })
  @ApiResponse({ status: 409, description: 'Already in a call' })
  async startCall(@Body() dto: StartCallDto, @Req() req: Request) {
    const userId = req['user'].sub;
    return this.callsService.startCall(userId, dto, dto.deviceId);
  }

  @Post(':callId/accept')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Accept an incoming call' })
  @ApiResponse({ status: 200, description: 'Call accepted' })
  @ApiResponse({ status: 404, description: 'Call not found' })
  async acceptCall(@Param('callId') callId: string, @Req() req: Request) {
    const userId = req['user'].sub;
    return this.callsService.acceptCall(userId, { callId });
  }

  @Post(':callId/decline')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Decline an incoming call' })
  @ApiResponse({ status: 200, description: 'Call declined' })
  @ApiResponse({ status: 404, description: 'Call not found' })
  async declineCall(@Param('callId') callId: string, @Req() req: Request) {
    const userId = req['user'].sub;
    return this.callsService.declineCall(userId, { callId });
  }

  @Post(':callId/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel an outgoing call' })
  @ApiResponse({ status: 200, description: 'Call cancelled' })
  @ApiResponse({ status: 404, description: 'Call not found' })
  async cancelCall(@Param('callId') callId: string, @Req() req: Request) {
    const userId = req['user'].sub;
    return this.callsService.cancelCall(userId, { callId });
  }

  @Post(':callId/end')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'End an active call' })
  @ApiResponse({ status: 200, description: 'Call ended' })
  @ApiResponse({ status: 404, description: 'Call not found' })
  async endCall(@Param('callId') callId: string, @Req() req: Request) {
    const userId = req['user'].sub;
    return this.callsService.endCall(userId, { callId });
  }

  @Post(':callId/offer')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send WebRTC offer' })
  @ApiResponse({ status: 200, description: 'Offer sent' })
  async sendOffer(@Param('callId') callId: string, @Body() dto: CallOfferDto, @Req() req: Request) {
    const userId = req['user'].sub;
    return this.callsService.sendOffer(userId, { ...dto, callId });
  }

  @Post(':callId/answer')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send WebRTC answer' })
  @ApiResponse({ status: 200, description: 'Answer sent' })
  async sendAnswer(@Param('callId') callId: string, @Body() dto: CallAnswerDto, @Req() req: Request) {
    const userId = req['user'].sub;
    return this.callsService.sendAnswer(userId, { ...dto, callId });
  }

  @Post(':callId/ice-candidate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send ICE candidate' })
  @ApiResponse({ status: 200, description: 'ICE candidate sent' })
  async sendIceCandidate(@Param('callId') callId: string, @Body() dto: IceCandidateDto, @Req() req: Request) {
    const userId = req['user'].sub;
    return this.callsService.sendIceCandidate(userId, { ...dto, callId });
  }

  @Get()
  @ApiOperation({ summary: 'Get call history' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false, enum: ['startedAt', 'durationSeconds'] })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiResponse({ status: 200, description: 'Call history' })
  async getCallHistory(@Query() query: CallHistoryQueryDto, @Req() req: Request) {
    const userId = req['user'].sub;
    return this.callsService.getCallHistory(userId, query);
  }

  @Get('active')
  @ApiOperation({ summary: 'Get active call' })
  @ApiResponse({ status: 200, description: 'Active call or null' })
  async getActiveCall(@Req() req: Request) {
    const userId = req['user'].sub;
    return this.callsService.getActiveCall(userId);
  }

  @Get(':callId')
  @ApiOperation({ summary: 'Get call details' })
  @ApiResponse({ status: 200, description: 'Call details' })
  async getCall(@Param('callId') callId: string, @Req() req: Request) {
    const userId = req['user'].sub;
    return this.callsService.getCall(callId, userId);
  }

  @Get('ice-servers')
  @ApiOperation({ summary: 'Get ICE servers (STUN/TURN)' })
  @ApiResponse({ status: 200, description: 'ICE servers configuration' })
  async getIceServers() {
    return this.callsService.getIceServers();
  }
}