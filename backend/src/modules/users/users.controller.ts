import { Controller, Get, Put, Delete, Post, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Request } from 'express';

import { UsersService } from './users.service';
import { ProfileService } from './services/profile.service';
import { PrivacyService } from './services/privacy.service';
import { BlockService } from './services/block.service';
import { JwtAuthGuard } from '@shared/guards/jwt-auth.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateAvatarDto } from './dto/update-avatar.dto';
import { UpdatePrivacyDto } from './dto/update-privacy.dto';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly profileService: ProfileService,
    private readonly privacyService: PrivacyService,
    private readonly blockService: BlockService,
  ) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  async getMe(@Req() req: Request) {
    const userId = req['user'].sub;
    return this.usersService.findById(userId);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search users' })
  @ApiQuery({ name: 'q', required: true })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async searchUsers(@Query('q') query: string, @Query('limit') limit: number, @Req() req: Request) {
    const userId = req['user'].sub;
    return this.usersService.searchUsers(query, userId, limit || 20);
  }

  @Get(':userId')
  @ApiOperation({ summary: 'Get user profile by ID' })
  async getUser(@Param('userId') userId: string, @Req() req: Request) {
    const requesterId = req['user'].sub;
    return this.usersService.getUserProfile(userId, requesterId);
  }

  @Put('profile')
  @ApiOperation({ summary: 'Update profile' })
  async updateProfile(@Body() dto: UpdateProfileDto, @Req() req: Request) {
    const userId = req['user'].sub;
    return this.profileService.updateProfile(userId, dto);
  }

  @Post('avatar/upload-url')
  @ApiOperation({ summary: 'Get presigned URL for avatar upload' })
  async getAvatarUploadUrl(@Body() dto: UpdateAvatarDto, @Req() req: Request) {
    const userId = req['user'].sub;
    return this.profileService.getAvatarUploadUrl(userId, dto);
  }

  @Put('avatar')
  @ApiOperation({ summary: 'Confirm avatar upload' })
  async confirmAvatar(@Body('avatarUrl') avatarUrl: string, @Req() req: Request) {
    const userId = req['user'].sub;
    return this.profileService.confirmAvatarUpload(userId, avatarUrl);
  }

  @Delete('avatar')
  @ApiOperation({ summary: 'Delete avatar' })
  async deleteAvatar(@Req() req: Request) {
    const userId = req['user'].sub;
    return this.profileService.deleteAvatar(userId);
  }

  @Get('privacy/settings')
  @ApiOperation({ summary: 'Get privacy settings' })
  async getPrivacySettings(@Req() req: Request) {
    const userId = req['user'].sub;
    return this.privacyService.getPrivacySettings(userId);
  }

  @Put('privacy/settings')
  @ApiOperation({ summary: 'Update privacy settings' })
  async updatePrivacySettings(@Body() dto: UpdatePrivacyDto, @Req() req: Request) {
    const userId = req['user'].sub;
    return this.privacyService.updatePrivacySettings(userId, dto);
  }

  @Post('block/:userId')
  @ApiOperation({ summary: 'Block a user' })
  async blockUser(@Param('userId') blockedId: string, @Req() req: Request) {
    const blockerId = req['user'].sub;
    return this.blockService.blockUser(blockerId, blockedId);
  }

  @Delete('block/:userId')
  @ApiOperation({ summary: 'Unblock a user' })
  async unblockUser(@Param('userId') blockedId: string, @Req() req: Request) {
    const blockerId = req['user'].sub;
    return this.blockService.unblockUser(blockerId, blockedId);
  }

  @Get('blocked')
  @ApiOperation({ summary: 'Get blocked users' })
  async getBlockedUsers(@Req() req: Request) {
    const userId = req['user'].sub;
    return this.blockService.getBlockedUsers(userId);
  }
}