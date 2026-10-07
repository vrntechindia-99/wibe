import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Request } from 'express';

import { StatusService } from './services/status.service';
import { JwtAuthGuard } from '@shared/guards/jwt-auth.guard';
import { CreateStatusDto, UpdateStatusDto, StatusReplyDto } from '../dto/status.dto';

@ApiTags('status')
@Controller('statuses')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class StatusController {
  constructor(private readonly statusService: StatusService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new status' })
  @ApiResponse({ status: 201, description: 'Status created' })
  async createStatus(@Body() dto: CreateStatusDto, @Req() req: Request) {
    const userId = req['user'].sub;
    return this.statusService.createStatus(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get statuses from contacts' })
  @ApiResponse({ status: 200, description: 'List of contact statuses' })
  async getContactStatuses(@Req() req: Request) {
    const userId = req['user'].sub;
    return this.statusService.getContactStatuses(userId);
  }

  @Get('mine')
  @ApiOperation({ summary: 'Get own statuses' })
  @ApiResponse({ status: 200, description: 'Own statuses' })
  async getMyStatuses(@Req() req: Request) {
    const userId = req['user'].sub;
    return this.statusService.getUserStatuses(userId, userId);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get statuses by user' })
  @ApiResponse({ status: 200, description: 'User statuses' })
  async getUserStatuses(@Param('userId') userId: string, @Req() req: Request) {
    const requesterId = req['user'].sub;
    return this.statusService.getUserStatuses(userId, requesterId);
  }

  @Get(':statusId')
  @ApiOperation({ summary: 'Get status by ID' })
  @ApiResponse({ status: 200, description: 'Status details' })
  async getStatus(@Param('statusId') statusId: string, @Req() req: Request) {
    const requesterId = req['user'].sub;
    return this.statusService.getStatus(statusId, requesterId);
  }

  @Post(':statusId/view')
  @ApiOperation({ summary: 'Record status view' })
  @ApiResponse({ status: 200, description: 'View recorded' })
  async viewStatus(@Param('statusId') statusId: string, @Req() req: Request) {
    const viewerId = req['user'].sub;
    return this.statusService.viewStatus(statusId, viewerId);
  }

  @Post(':statusId/reply')
  @ApiOperation({ summary: 'Reply to status' })
  @ApiResponse({ status: 201, description: 'Reply sent' })
  async replyToStatus(
    @Param('statusId') statusId: string,
    @Body() dto: StatusReplyDto,
    @Req() req: Request,
  ) {
    const userId = req['user'].sub;
    return this.statusService.replyToStatus(statusId, userId, dto);
  }

  @Post(':statusId/reactions')
  @ApiOperation({ summary: 'Add reaction to status' })
  @ApiResponse({ status: 201, description: 'Reaction added' })
  async addReaction(
    @Param('statusId') statusId: string,
    @Body('emoji') emoji: string,
    @Req() req: Request,
  ) {
    const userId = req['user'].sub;
    return this.statusService.addReaction(statusId, userId, emoji);
  }

  @Delete(':statusId/reactions/:emoji')
  @ApiOperation({ summary: 'Remove reaction from status' })
  @ApiResponse({ status: 200, description: 'Reaction removed' })
  async removeReaction(
    @Param('statusId') statusId: string,
    @Param('emoji') emoji: string,
    @Req() req: Request,
  ) {
    const userId = req['user'].sub;
    return this.statusService.removeReaction(statusId, userId, emoji);
  }

  @Get(':statusId/reactions')
  @ApiOperation({ summary: 'Get reactions on status' })
  @ApiResponse({ status: 200, description: 'Reactions list' })
  async getReactions(@Param('statusId') statusId: string, @Req() req: Request) {
    const userId = req['user'].sub;
    return this.statusService.getReactions(statusId, userId);
  }

  @Patch(':statusId')
  @ApiOperation({ summary: 'Update status' })
  @ApiResponse({ status: 200, description: 'Status updated' })
  async updateStatus(
    @Param('statusId') statusId: string,
    @Body() dto: UpdateStatusDto,
    @Req() req: Request,
  ) {
    const userId = req['user'].sub;
    return this.statusService.updateStatus(statusId, userId, dto);
  }

  @Delete(':statusId')
  @ApiOperation({ summary: 'Delete status' })
  @ApiResponse({ status: 200, description: 'Status deleted' })
  async deleteStatus(@Param('statusId') statusId: string, @Req() req: Request) {
    const userId = req['user'].sub;
    return this.statusService.deleteStatus(statusId, userId);
  }
}