import { Controller, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { Request } from 'express';

import { ForwardingService } from './services/forwarding.service';
import { JwtAuthGuard } from '@shared/guards/jwt-auth.guard';
import { ForwardMessageDto } from '../dto/forward-message.dto';

@ApiTags('forwarding')
@Controller('messages/:messageId/forward')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ForwardingController {
  constructor(private readonly forwardingService: ForwardingService) {}

  @Post()
  @ApiOperation({ summary: 'Forward message to conversations' })
  @ApiParam({ name: 'messageId', description: 'Message ID to forward' })
  @ApiResponse({ status: 201, description: 'Message forwarded' })
  @ApiResponse({ status: 403, description: 'Not authorized' })
  async forwardMessage(
    @Param('messageId') messageId: string,
    @Body() dto: ForwardMessageDto,
    @Req() req: Request,
  ) {
    const userId = req['user'].sub;
    return this.forwardingService.forwardMessage(messageId, userId, dto);
  }
}