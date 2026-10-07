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

import { GroupsService } from './services/groups.service';
import { JwtAuthGuard } from '@shared/guards/jwt-auth.guard';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { GroupSettingsDto } from './dto/group-settings.dto';
import { GroupQueryDto } from './dto/group-query.dto';

@ApiTags('groups')
@Controller('groups')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Get()
  @ApiOperation({ summary: 'Get user groups' })
  @ApiResponse({ status: 200, description: 'List of groups' })
  async getGroups(@Query() query: GroupQueryDto, @Req() req: Request) {
    const userId = req['user'].sub;
    return this.groupsService.getUserGroups(userId, query);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new group' })
  @ApiResponse({ status: 201, description: 'Group created' })
  async createGroup(@Body() dto: CreateGroupDto, @Req() req: Request) {
    const userId = req['user'].sub;
    return this.groupsService.createGroup(userId, dto);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search groups' })
  @ApiQuery({ name: 'q', required: true })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Group search results' })
  async searchGroups(@Query('q') query: string, @Query('limit') limit: number, @Req() req: Request) {
    const userId = req['user'].sub;
    return this.groupsService.searchGroups(query, userId, limit || 20);
  }

  @Get(':groupId')
  @ApiOperation({ summary: 'Get group by ID' })
  @ApiResponse({ status: 200, description: 'Group details' })
  async getGroup(@Param('groupId') groupId: string, @Req() req: Request) {
    const userId = req['user'].sub;
    return this.groupsService.getGroup(groupId, userId);
  }

  @Patch(':groupId')
  @ApiOperation({ summary: 'Update group info' })
  @ApiResponse({ status: 200, description: 'Group updated' })
  async updateGroup(
    @Param('groupId') groupId: string,
    @Body() dto: UpdateGroupDto,
    @Req() req: Request,
  ) {
    const userId = req['user'].sub;
    return this.groupsService.updateGroup(groupId, userId, dto);
  }

  @Patch(':groupId/settings')
  @ApiOperation({ summary: 'Update group settings' })
  @ApiResponse({ status: 200, description: 'Settings updated' })
  async updateSettings(
    @Param('groupId') groupId: string,
    @Body() dto: GroupSettingsDto,
    @Req() req: Request,
  ) {
    const userId = req['user'].sub;
    return this.groupsService.updateGroupSettings(groupId, userId, dto);
  }

  @Post(':groupId/avatar/upload-url')
  @ApiOperation({ summary: 'Get presigned URL for group avatar upload' })
  @ApiResponse({ status: 200, description: 'Upload URL' })
  async getAvatarUploadUrl(
    @Param('groupId') groupId: string,
    @Body('fileName') fileName: string,
    @Body('contentType') contentType: string,
    @Req() req: Request,
  ) {
    const userId = req['user'].sub;
    return this.groupsService.getGroupAvatarUploadUrl(groupId, userId, fileName, contentType);
  }

  @Put(':groupId/avatar')
  @ApiOperation({ summary: 'Update group avatar' })
  @ApiResponse({ status: 200, description: 'Avatar updated' })
  async updateAvatar(
    @Param('groupId') groupId: string,
    @Body('avatarUrl') avatarUrl: string,
    @Req() req: Request,
  ) {
    const userId = req['user'].sub;
    return this.groupsService.updateGroupAvatar(groupId, userId, avatarUrl);
  }

  @Post(':groupId/members')
  @ApiOperation({ summary: 'Add members to group' })
  @ApiResponse({ status: 201, description: 'Members added' })
  async addMembers(
    @Param('groupId') groupId: string,
    @Body('memberIds') memberIds: string[],
    @Req() req: Request,
  ) {
    const userId = req['user'].sub;
    return this.groupsService.addMembers(groupId, userId, memberIds);
  }

  @Delete(':groupId/members/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove member from group' })
  @ApiResponse({ status: 200, description: 'Member removed' })
  async removeMember(
    @Param('groupId') groupId: string,
    @Param('userId') targetUserId: string,
    @Req() req: Request,
  ) {
    const userId = req['user'].sub;
    return this.groupsService.removeMember(groupId, userId, targetUserId);
  }

  @Post(':groupId/leave')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Leave group' })
  @ApiResponse({ status: 200, description: 'Left group' })
  async leaveGroup(@Param('groupId') groupId: string, @Req() req: Request) {
    const userId = req['user'].sub;
    return this.groupsService.leaveGroup(groupId, userId);
  }

  @Post(':groupId/members/:userId/promote')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Promote member to admin' })
  @ApiResponse({ status: 200, description: 'Member promoted' })
  async promoteAdmin(
    @Param('groupId') groupId: string,
    @Param('userId') targetUserId: string,
    @Req() req: Request,
  ) {
    const userId = req['user'].sub;
    return this.groupsService.promoteAdmin(groupId, userId, targetUserId);
  }

  @Post(':groupId/members/:userId/demote')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Demote admin to member' })
  @ApiResponse({ status: 200, description: 'Admin demoted' })
  async demoteAdmin(
    @Param('groupId') groupId: string,
    @Param('userId') targetUserId: string,
    @Req() req: Request,
  ) {
    const userId = req['user'].sub;
    return this.groupsService.demoteAdmin(groupId, userId, targetUserId);
  }

  @Get(':groupId/members')
  @ApiOperation({ summary: 'Get group members' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Group members' })
  async getMembers(
    @Param('groupId') groupId: string,
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Req() req: Request,
  ) {
    const userId = req['user'].sub;
    return this.groupsService.getGroupMembers(groupId, userId, page || 1, limit || 50);
  }

  @Delete(':groupId')
  @ApiOperation({ summary: 'Delete group (owner only)' })
  @ApiResponse({ status: 200, description: 'Group deleted' })
  async deleteGroup(@Param('groupId') groupId: string, @Req() req: Request) {
    const userId = req['user'].sub;
    return this.groupsService.deleteGroup(groupId, userId);
  }
}