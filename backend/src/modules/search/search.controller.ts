import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Request } from 'express';

import { SearchService } from './search.service';
import { JwtAuthGuard } from '@shared/guards/jwt-auth.guard';

@ApiTags('search')
@Controller('search')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('users')
  @ApiOperation({ summary: 'Search users' })
  @ApiQuery({ name: 'q', required: true, description: 'Search query (min 2 chars)' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'User search results' })
  async searchUsers(@Query('q') query: string, @Query('limit') limit: number, @Req() req: Request) {
    const userId = req['user'].sub;
    return this.searchService.searchUsers(query, userId, limit || 20);
  }

  @Get('conversations')
  @ApiOperation({ summary: 'Search conversations' })
  @ApiQuery({ name: 'q', required: true, description: 'Search query (min 2 chars)' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Conversation search results' })
  async searchConversations(@Query('q') query: string, @Query('limit') limit: number, @Req() req: Request) {
    const userId = req['user'].sub;
    return this.searchService.searchConversations(query, userId, limit || 20);
  }

  @Get('messages')
  @ApiOperation({ summary: 'Search messages' })
  @ApiQuery({ name: 'q', required: true, description: 'Search query (min 2 chars)' })
  @ApiQuery({ name: 'conversationId', required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Message search results' })
  async searchMessages(
    @Query('q') query: string,
    @Query('conversationId') conversationId: string,
    @Query('limit') limit: number,
    @Req() req: Request,
  ) {
    const userId = req['user'].sub;
    return this.searchService.searchMessages(query, userId, conversationId, limit || 20);
  }
}