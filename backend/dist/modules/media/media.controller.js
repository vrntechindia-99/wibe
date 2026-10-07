"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MediaController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const media_service_1 = require("./services/media.service");
const jwt_auth_guard_1 = require("@shared/guards/jwt-auth.guard");
const create_upload_session_dto_1 = require("./dto/create-upload-session.dto");
const complete_upload_dto_1 = require("./dto/complete-upload.dto");
let MediaController = class MediaController {
    constructor(mediaService) {
        this.mediaService = mediaService;
    }
    async createUploadSession(dto, req) {
        const userId = req['user'].sub;
        return this.mediaService.createUploadSession(userId, dto);
    }
    async createMultipartUploadSession(dto, req) {
        const userId = req['user'].sub;
        return this.mediaService.createMultipartUploadSession(userId, dto);
    }
    async getPartUploadUrl(sessionId, partNumber) {
        return this.mediaService.getPresignedPartUrl(sessionId, partNumber);
    }
    async completeMultipartUpload(sessionId, dto, req) {
        const userId = req['user'].sub;
        dto.uploadSessionId = sessionId;
        return this.mediaService.completeMultipartUpload(userId, dto);
    }
    async completeSinglePartUpload(sessionId, dto, req) {
        const userId = req['user'].sub;
        dto.uploadSessionId = sessionId;
        return this.mediaService.completeSinglePartUpload(userId, dto);
    }
    async getAttachment(attachmentId, req) {
        const userId = req['user'].sub;
        return this.mediaService.getMediaAttachment(attachmentId, userId);
    }
    async getDownloadUrl(attachmentId, req) {
        const userId = req['user'].sub;
        const url = await this.mediaService.getPresignedDownloadUrl(attachmentId, userId);
        return { downloadUrl: url };
    }
    async deleteAttachment(attachmentId, req) {
        const userId = req['user'].sub;
        await this.mediaService.deleteMedia(attachmentId, userId);
        return { message: 'Attachment deleted' };
    }
    async getConversationMedia(conversationId, type, limit, req) {
        const userId = req['user'].sub;
        return this.mediaService.getConversationMedia(conversationId, userId, type, limit || 50);
    }
};
exports.MediaController = MediaController;
__decorate([
    (0, common_1.Post)('upload-session'),
    (0, swagger_1.ApiOperation)({ summary: 'Create upload session for media' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Upload session created with presigned URL' }),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_upload_session_dto_1.CreateUploadSessionDto, Object]),
    __metadata("design:returntype", Promise)
], MediaController.prototype, "createUploadSession", null);
__decorate([
    (0, common_1.Post)('upload-session/multipart'),
    (0, swagger_1.ApiOperation)({ summary: 'Create multipart upload session for large media' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Multipart upload session created' }),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_upload_session_dto_1.CreateUploadSessionDto, Object]),
    __metadata("design:returntype", Promise)
], MediaController.prototype, "createMultipartUploadSession", null);
__decorate([
    (0, common_1.Get)('upload-session/:sessionId/part-url'),
    (0, swagger_1.ApiOperation)({ summary: 'Get presigned URL for a multipart part' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Presigned URL for part upload' }),
    openapi.ApiResponse({ status: 200, type: String }),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Query)('partNumber')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", Promise)
], MediaController.prototype, "getPartUploadUrl", null);
__decorate([
    (0, common_1.Post)('upload-session/:sessionId/complete'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Complete multipart upload' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Upload completed, message created' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, complete_upload_dto_1.CompleteUploadDto, Object]),
    __metadata("design:returntype", Promise)
], MediaController.prototype, "completeMultipartUpload", null);
__decorate([
    (0, common_1.Post)('upload-session/:sessionId/complete-single'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Complete single-part upload' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Upload completed, message created' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, complete_upload_dto_1.CompleteUploadDto, Object]),
    __metadata("design:returntype", Promise)
], MediaController.prototype, "completeSinglePartUpload", null);
__decorate([
    (0, common_1.Get)('attachment/:attachmentId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get attachment metadata' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Attachment metadata' }),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, common_1.Param)('attachmentId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MediaController.prototype, "getAttachment", null);
__decorate([
    (0, common_1.Get)('attachment/:attachmentId/download'),
    (0, swagger_1.ApiOperation)({ summary: 'Get presigned download URL for attachment' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Presigned download URL' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('attachmentId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MediaController.prototype, "getDownloadUrl", null);
__decorate([
    (0, common_1.Delete)('attachment/:attachmentId'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Delete media attachment' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Attachment deleted' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, common_1.Param)('attachmentId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MediaController.prototype, "deleteAttachment", null);
__decorate([
    (0, common_1.Get)('conversation/:conversationId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get media in conversation' }),
    ApiQuery({ name: 'type', required: false, enum: create_upload_session_dto_1.MediaType }),
    ApiQuery({ name: 'limit', required: false, type: Number }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Conversation media' }),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, common_1.Param)('conversationId')),
    __param(1, (0, common_1.Query)('type')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Number, Object]),
    __metadata("design:returntype", Promise)
], MediaController.prototype, "getConversationMedia", null);
exports.MediaController = MediaController = __decorate([
    (0, swagger_1.ApiTags)('media'),
    (0, common_1.Controller)('media'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [media_service_1.MediaService])
], MediaController);
//# sourceMappingURL=media.controller.js.map