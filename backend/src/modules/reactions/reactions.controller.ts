import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { Request } from 'express';

import { ReactionsService } from './services/reactions.service';
import { JwtAuthGuard } from '@shared/guards/jwt-auth.guard';
import { AddReactionDto } from './dto/add-reaction.dto';

@ApiTags('reactions')
@Controller('messages/:messageId/reactions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ReactionsController {
  constructor(private readonly reactionsService: ReactionsService) {}

  @Post()
  @ApiOperation({ summary: 'Add reaction to message' })
  @ApiParam({ name: 'messageId', description: 'Message ID' })
  @ApiResponse({ status: 201, description: 'Reaction added' })
  @ApiResponse({ status: 409, description: 'Reaction already exists' })
  async addReaction(
    @Param('messageId') messageId: string,
    @Body() dto: AddReactionDto,
    @Req() req: Request,
  ) {
    const userId = req['user'].sub;
    return this.reactionsService.addReaction(messageId, userId, dto);
  }

  @Delete(':emoji')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove reaction from message' })
  @ApiParam({ name: 'messageId', description: 'Message ID' })
  @ApiParam({ name: 'emoji', description: 'Emoji to remove' })
  @ApiResponse({ status: 200, description: 'Reaction removed' })
  @ApiResponse({ status: 404, description: 'Reaction not found' })
  async removeReaction(
    @Param('messageId') messageId: string,
    @Param('emoji') emoji: string,
    @Req() req: Request,
  ) {
    const userId = req['user'].sub;
    return this.reactionsService.removeReaction(messageId, userId, emoji);
  }

  @Get()
  @ApiOperation({ summary: 'Get all reactions on message' })
  @ApiParam({ name: 'messageId', description: 'Message ID' })
  @ApiResponse({ status: 200, description: 'Reactions list' })
  async getReactions(@Param('messageId') messageId: string, @Req() req: Request) {
    const userId = req['user'].sub;
    return this.reactionsService.getReactions(messageId, userId);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user reactions on message' })
  @ApiParam({ name: 'messageId', description: 'Message ID' })
  @ApiResponse({ status: 200, description: 'User reactions' })
  async getUserReactions(@Param('messageId') messageId: string, @Req() req: Request) {
    const userId = req['user'].sub;
    return this.reactionsService.getUserReaction(messageId, userId);
  }
}