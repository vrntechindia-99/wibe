import { Controller, Get, Delete, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';

import { VoiceMessagesService } from './services/voice-messages.service';
import { JwtAuthGuard } from '@shared/guards/jwt-auth.guard';

@ApiTags('voice-messages')
@Controller('voice-messages')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class VoiceMessagesController {
  constructor(private readonly voiceMessagesService: VoiceMessagesService) {}

  @Get(':messageId')
  @ApiOperation({ summary: 'Get voice message details' })
  @ApiResponse({ status: 200, description: 'Voice message with download URL' })
  async getVoiceMessage(@Param('messageId') messageId: string, @Req() req: Request) {
    const userId = req['user'].sub;
    return this.voiceMessagesService.getVoiceMessage(messageId, userId);
  }

  @Get('conversation/:conversationId')
  @ApiOperation({ summary: 'Get all voice messages in conversation' })
  @ApiResponse({ status: 200, description: 'List of voice messages' })
  async getVoiceMessagesInConversation(@Param('conversationId') conversationId: string, @Req() req: Request) {
    const userId = req['user'].sub;
    return this.voiceMessagesService.getVoiceMessagesInConversation(conversationId, userId);
  }

  @Delete(':messageId')
  @ApiOperation({ summary: 'Delete voice message' })
  @ApiResponse({ status: 200, description: 'Voice message deleted' })
  async deleteVoiceMessage(@Param('messageId') messageId: string, @Req() req: Request) {
    const userId = req['user'].sub;
    return this.voiceMessagesService.deleteVoiceMessage(messageId, userId);
  }
}