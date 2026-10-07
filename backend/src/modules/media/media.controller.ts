import { Controller, Post, Get, Delete, Body, Param, Query, UseGuards, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { Request } from 'express';

import { MediaService } from './services/media.service';
import { JwtAuthGuard } from '@shared/guards/jwt-auth.guard';
import { CreateUploadSessionDto, MediaType } from './dto/create-upload-session.dto';
import { CompleteUploadDto } from './dto/complete-upload.dto';

@ApiTags('media')
@Controller('media')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('upload-session')
  @ApiOperation({ summary: 'Create upload session for media' })
  @ApiResponse({ status: 201, description: 'Upload session created with presigned URL' })
  async createUploadSession(@Body() dto: CreateUploadSessionDto, @Req() req: Request) {
    const userId = req['user'].sub;
    return this.mediaService.createUploadSession(userId, dto);
  }

  @Post('upload-session/multipart')
  @ApiOperation({ summary: 'Create multipart upload session for large media' })
  @ApiResponse({ status: 201, description: 'Multipart upload session created' })
  async createMultipartUploadSession(@Body() dto: CreateUploadSessionDto, @Req() req: Request) {
    const userId = req['user'].sub;
    return this.mediaService.createMultipartUploadSession(userId, dto);
  }

  @Get('upload-session/:sessionId/part-url')
  @ApiOperation({ summary: 'Get presigned URL for a multipart part' })
  @ApiResponse({ status: 200, description: 'Presigned URL for part upload' })
  async getPartUploadUrl(@Param('sessionId') sessionId: string, @Query('partNumber') partNumber: number) {
    return this.mediaService.getPresignedPartUrl(sessionId, partNumber);
  }

  @Post('upload-session/:sessionId/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Complete multipart upload' })
  @ApiResponse({ status: 200, description: 'Upload completed, message created' })
  async completeMultipartUpload(
    @Param('sessionId') sessionId: string,
    @Body() dto: CompleteUploadDto,
    @Req() req: Request,
  ) {
    const userId = req['user'].sub;
    dto.uploadSessionId = sessionId;
    return this.mediaService.completeMultipartUpload(userId, dto);
  }

  @Post('upload-session/:sessionId/complete-single')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Complete single-part upload' })
  @ApiResponse({ status: 200, description: 'Upload completed, message created' })
  async completeSinglePartUpload(
    @Param('sessionId') sessionId: string,
    @Body() dto: CompleteUploadDto,
    @Req() req: Request,
  ) {
    const userId = req['user'].sub;
    dto.uploadSessionId = sessionId;
    return this.mediaService.completeSinglePartUpload(userId, dto);
  }

  @Get('attachment/:attachmentId')
  @ApiOperation({ summary: 'Get attachment metadata' })
  @ApiResponse({ status: 200, description: 'Attachment metadata' })
  async getAttachment(@Param('attachmentId') attachmentId: string, @Req() req: Request) {
    const userId = req['user'].sub;
    return this.mediaService.getMediaAttachment(attachmentId, userId);
  }

  @Get('attachment/:attachmentId/download')
  @ApiOperation({ summary: 'Get presigned download URL for attachment' })
  @ApiResponse({ status: 200, description: 'Presigned download URL' })
  async getDownloadUrl(@Param('attachmentId') attachmentId: string, @Req() req: Request) {
    const userId = req['user'].sub;
    const url = await this.mediaService.getPresignedDownloadUrl(attachmentId, userId);
    return { downloadUrl: url };
  }

  @Delete('attachment/:attachmentId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete media attachment' })
  @ApiResponse({ status: 200, description: 'Attachment deleted' })
  async deleteAttachment(@Param('attachmentId') attachmentId: string, @Req() req: Request) {
    const userId = req['user'].sub;
    await this.mediaService.deleteMedia(attachmentId, userId);
    return { message: 'Attachment deleted' };
  }

  @Get('conversation/:conversationId')
  @ApiOperation({ summary: 'Get media in conversation' })
  @ApiQuery({ name: 'type', required: false, enum: MediaType })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Conversation media' })
  async getConversationMedia(
    @Param('conversationId') conversationId: string,
    @Query('type') type: MediaType,
    @Query('limit') limit: number,
    @Req() req: Request,
  ) {
    const userId = req['user'].sub;
    return this.mediaService.getConversationMedia(conversationId, userId, type, limit || 50);
  }
}