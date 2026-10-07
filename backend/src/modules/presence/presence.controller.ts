import { Controller, Get, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Request } from 'express';

import { PresenceService } from './presence.service';
import { JwtAuthGuard } from '@shared/guards/jwt-auth.guard';

@ApiTags('presence')
@Controller('presence')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PresenceController {
  constructor(private readonly presenceService: PresenceService) {}

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get user presence' })
  @ApiResponse({ status: 200, description: 'User presence' })
  async getUserPresence(@Param('userId') userId: string, @Req() req: Request) {
    const requesterId = req['user'].sub;
    return this.presenceService.getPresence(userId, requesterId);
  }

  @Get('users')
  @ApiOperation({ summary: 'Get multiple users presence' })
  @ApiQuery({ name: 'ids', required: true, description: 'Comma-separated user IDs' })
  @ApiResponse({ status: 200, description: 'Users presence' })
  async getUsersPresence(@Query('ids') ids: string, @Req() req: Request) {
    const requesterId = req['user'].sub;
    const userIds = ids.split(',').filter(Boolean);
    return this.presenceService.getOnlineUsers(userIds, requesterId);
  }

  @Get('conversation/:conversationId')
  @ApiOperation({ summary: 'Get conversation members presence' })
  @ApiResponse({ status: 200, description: 'Conversation members presence' })
  async getConversationPresence(@Param('conversationId') conversationId: string, @Req() req: Request) {
    const userId = req['user'].sub;
    return this.presenceService.getConversationPresence(conversationId, userId);
  }
}