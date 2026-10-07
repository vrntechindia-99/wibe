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

import { MessagesService } from './services/messages.service';
import { JwtAuthGuard } from '@shared/guards/jwt-auth.guard';
import { SendMessageDto } from './dto/send-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { MessageQueryDto } from './dto/message-query.dto';

@ApiTags('messages')
@Controller('conversations/:conversationId/messages')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  @ApiOperation({ summary: 'Send a message' })
  @ApiResponse({ status: 201, description: 'Message sent' })
  async sendMessage(
    @Param('conversationId') conversationId: string,
    @Body() dto: SendMessageDto,
    @Req() req: Request,
  ) {
    const senderId = req['user'].sub;
    return this.messagesService.sendMessage(conversationId, senderId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get messages in conversation' })
  @ApiResponse({ status: 200, description: 'List of messages' })
  async getMessages(
    @Param('conversationId') conversationId: string,
    @Query() query: MessageQueryDto,
    @Req() req: Request,
  ) {
    const userId = req['user'].sub;
    return this.messagesService.getMessages(conversationId, userId, query);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search messages in conversation' })
  @ApiQuery({ name: 'q', required: true })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Search results' })
  async searchMessages(
    @Param('conversationId') conversationId: string,
    @Query('q') query: string,
    @Query('limit') limit: number,
    @Req() req: Request,
  ) {
    const userId = req['user'].sub;
    return this.messagesService.searchMessages(userId, query, conversationId, limit || 20);
  }

  @Get(':messageId')
  @ApiOperation({ summary: 'Get message by ID' })
  @ApiResponse({ status: 200, description: 'Message details' })
  async getMessage(@Param('conversationId') conversationId: string, @Param('messageId') messageId: string, @Req() req: Request) {
    const userId = req['user'].sub;
    return this.messagesService.getMessage(messageId, userId);
  }

  @Patch(':messageId')
  @ApiOperation({ summary: 'Update message' })
  @ApiResponse({ status: 200, description: 'Message updated' })
  async updateMessage(
    @Param('conversationId') conversationId: string,
    @Param('messageId') messageId: string,
    @Body() dto: UpdateMessageDto,
    @Req() req: Request,
  ) {
    const userId = req['user'].sub;
    return this.messagesService.updateMessage(messageId, userId, dto);
  }

  @Delete(':messageId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete message' })
  @ApiQuery({ name: 'forEveryone', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Message deleted' })
  async deleteMessage(
    @Param('conversationId') conversationId: string,
    @Param('messageId') messageId: string,
    @Query('forEveryone') forEveryone: boolean,
    @Req() req: Request,
  ) {
    const userId = req['user'].sub;
    return this.messagesService.deleteMessage(messageId, userId, forEveryone || false);
  }
}