import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
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

import { ConversationsService } from './services/conversations.service';
import { JwtAuthGuard } from '@shared/guards/jwt-auth.guard';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { ConversationQueryDto } from './dto/conversation-query.dto';
import { MuteConversationDto } from './dto/mute-conversation.dto';

@ApiTags('conversations')
@Controller('conversations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get user conversations' })
  @ApiResponse({ status: 200, description: 'List of conversations' })
  async getConversations(@Query() query: ConversationQueryDto, @Req() req: Request) {
    const userId = req['user'].sub;
    return this.conversationsService.getConversations(userId, query);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new conversation' })
  @ApiResponse({ status: 201, description: 'Conversation created' })
  async createConversation(@Body() dto: CreateConversationDto, @Req() req: Request) {
    const userId = req['user'].sub;
    if (dto.userId && !dto.name) {
      return this.conversationsService.createDirectConversation(userId, dto);
    }
    return this.conversationsService.createGroupConversation(userId, dto);
  }

  @Get(':conversationId')
  @ApiOperation({ summary: 'Get conversation by ID' })
  @ApiResponse({ status: 200, description: 'Conversation details' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  async getConversation(@Param('conversationId') conversationId: string, @Req() req: Request) {
    const userId = req['user'].sub;
    return this.conversationsService.getConversation(conversationId, userId);
  }

  @Patch(':conversationId')
  @ApiOperation({ summary: 'Update conversation' })
  @ApiResponse({ status: 200, description: 'Conversation updated' })
  async updateConversation(
    @Param('conversationId') conversationId: string,
    @Body() dto: UpdateConversationDto,
    @Req() req: Request,
  ) {
    const userId = req['user'].sub;
    return this.conversationsService.updateConversation(conversationId, userId, dto);
  }

  @Post(':conversationId/pin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Pin conversation' })
  @ApiResponse({ status: 200, description: 'Conversation pinned' })
  async pinConversation(@Param('conversationId') conversationId: string, @Req() req: Request) {
    const userId = req['user'].sub;
    return this.conversationsService.pinConversation(conversationId, userId);
  }

  @Delete(':conversationId/pin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unpin conversation' })
  @ApiResponse({ status: 200, description: 'Conversation unpinned' })
  async unpinConversation(@Param('conversationId') conversationId: string, @Req() req: Request) {
    const userId = req['user'].sub;
    return this.conversationsService.unpinConversation(conversationId, userId);
  }

  @Post(':conversationId/mute')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mute conversation' })
  @ApiResponse({ status: 200, description: 'Conversation muted' })
  async muteConversation(
    @Param('conversationId') conversationId: string,
    @Body() dto: MuteConversationDto,
    @Req() req: Request,
  ) {
    const userId = req['user'].sub;
    return this.conversationsService.muteConversation(conversationId, userId, dto);
  }

  @Delete(':conversationId/mute')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unmute conversation' })
  @ApiResponse({ status: 200, description: 'Conversation unmuted' })
  async unmuteConversation(@Param('conversationId') conversationId: string, @Req() req: Request) {
    const userId = req['user'].sub;
    return this.conversationsService.unmuteConversation(conversationId, userId);
  }

  @Post(':conversationId/archive')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Archive conversation' })
  @ApiResponse({ status: 200, description: 'Conversation archived' })
  async archiveConversation(@Param('conversationId') conversationId: string, @Req() req: Request) {
    const userId = req['user'].sub;
    return this.conversationsService.archiveConversation(conversationId, userId);
  }

  @Delete(':conversationId/archive')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unarchive conversation' })
  @ApiResponse({ status: 200, description: 'Conversation unarchived' })
  async unarchiveConversation(@Param('conversationId') conversationId: string, @Req() req: Request) {
    const userId = req['user'].sub;
    return this.conversationsService.unarchiveConversation(conversationId, userId);
  }

  @Post(':conversationId/mark-unread')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark conversation as unread' })
  @ApiResponse({ status: 200, description: 'Conversation marked unread' })
  async markUnread(@Param('conversationId') conversationId: string, @Req() req: Request) {
    const userId = req['user'].sub;
    return this.conversationsService.markUnread(conversationId, userId);
  }

  @Post(':conversationId/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark messages as read' })
  @ApiResponse({ status: 200, description: 'Messages marked as read' })
  async markAsRead(
    @Param('conversationId') conversationId: string,
    @Query('messageId') messageId: string,
    @Req() req: Request,
  ) {
    const userId = req['user'].sub;
    return this.conversationsService.markAsRead(conversationId, userId, messageId);
  }

  @Post(':conversationId/delivered')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark message as delivered' })
  @ApiResponse({ status: 200, description: 'Message marked as delivered' })
  async markAsDelivered(
    @Param('conversationId') conversationId: string,
    @Body('messageId') messageId: string,
    @Req() req: Request,
  ) {
    const userId = req['user'].sub;
    return this.conversationsService.markAsDelivered(conversationId, userId, messageId);
  }

  @Delete(':conversationId')
  @ApiOperation({ summary: 'Delete conversation' })
  @ApiResponse({ status: 200, description: 'Conversation deleted' })
  async deleteConversation(
    @Param('conversationId') conversationId: string,
    @Query('forEveryone') forEveryone: boolean,
    @Req() req: Request,
  ) {
    const userId = req['user'].sub;
    return this.conversationsService.deleteConversation(conversationId, userId, forEveryone);
  }
}