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
exports.ConversationsController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const conversations_service_1 = require("./services/conversations.service");
const jwt_auth_guard_1 = require("@shared/guards/jwt-auth.guard");
const create_conversation_dto_1 = require("./dto/create-conversation.dto");
const update_conversation_dto_1 = require("./dto/update-conversation.dto");
const conversation_query_dto_1 = require("./dto/conversation-query.dto");
const mute_conversation_dto_1 = require("./dto/mute-conversation.dto");
let ConversationsController = class ConversationsController {
    constructor(conversationsService) {
        this.conversationsService = conversationsService;
    }
    async getConversations(query, req) {
        const userId = req['user'].sub;
        return this.conversationsService.getConversations(userId, query);
    }
    async createConversation(dto, req) {
        const userId = req['user'].sub;
        if (dto.userId && !dto.name) {
            return this.conversationsService.createDirectConversation(userId, dto);
        }
        return this.conversationsService.createGroupConversation(userId, dto);
    }
    async getConversation(conversationId, req) {
        const userId = req['user'].sub;
        return this.conversationsService.getConversation(conversationId, userId);
    }
    async updateConversation(conversationId, dto, req) {
        const userId = req['user'].sub;
        return this.conversationsService.updateConversation(conversationId, userId, dto);
    }
    async pinConversation(conversationId, req) {
        const userId = req['user'].sub;
        return this.conversationsService.pinConversation(conversationId, userId);
    }
    async unpinConversation(conversationId, req) {
        const userId = req['user'].sub;
        return this.conversationsService.unpinConversation(conversationId, userId);
    }
    async muteConversation(conversationId, dto, req) {
        const userId = req['user'].sub;
        return this.conversationsService.muteConversation(conversationId, userId, dto);
    }
    async unmuteConversation(conversationId, req) {
        const userId = req['user'].sub;
        return this.conversationsService.unmuteConversation(conversationId, userId);
    }
    async archiveConversation(conversationId, req) {
        const userId = req['user'].sub;
        return this.conversationsService.archiveConversation(conversationId, userId);
    }
    async unarchiveConversation(conversationId, req) {
        const userId = req['user'].sub;
        return this.conversationsService.unarchiveConversation(conversationId, userId);
    }
    async markUnread(conversationId, req) {
        const userId = req['user'].sub;
        return this.conversationsService.markUnread(conversationId, userId);
    }
    async markAsRead(conversationId, messageId, req) {
        const userId = req['user'].sub;
        return this.conversationsService.markAsRead(conversationId, userId, messageId);
    }
    async markAsDelivered(conversationId, messageId, req) {
        const userId = req['user'].sub;
        return this.conversationsService.markAsDelivered(conversationId, userId, messageId);
    }
    async deleteConversation(conversationId, forEveryone, req) {
        const userId = req['user'].sub;
        return this.conversationsService.deleteConversation(conversationId, userId, forEveryone);
    }
};
exports.ConversationsController = ConversationsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get user conversations' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of conversations' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [conversation_query_dto_1.ConversationQueryDto, Object]),
    __metadata("design:returntype", Promise)
], ConversationsController.prototype, "getConversations", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new conversation' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Conversation created' }),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_conversation_dto_1.CreateConversationDto, Object]),
    __metadata("design:returntype", Promise)
], ConversationsController.prototype, "createConversation", null);
__decorate([
    (0, common_1.Get)(':conversationId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get conversation by ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Conversation details' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Conversation not found' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('conversationId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ConversationsController.prototype, "getConversation", null);
__decorate([
    (0, common_1.Patch)(':conversationId'),
    (0, swagger_1.ApiOperation)({ summary: 'Update conversation' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Conversation updated' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('conversationId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_conversation_dto_1.UpdateConversationDto, Object]),
    __metadata("design:returntype", Promise)
], ConversationsController.prototype, "updateConversation", null);
__decorate([
    (0, common_1.Post)(':conversationId/pin'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Pin conversation' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Conversation pinned' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, common_1.Param)('conversationId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ConversationsController.prototype, "pinConversation", null);
__decorate([
    (0, common_1.Delete)(':conversationId/pin'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Unpin conversation' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Conversation unpinned' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, common_1.Param)('conversationId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ConversationsController.prototype, "unpinConversation", null);
__decorate([
    (0, common_1.Post)(':conversationId/mute'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Mute conversation' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Conversation muted' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, common_1.Param)('conversationId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, mute_conversation_dto_1.MuteConversationDto, Object]),
    __metadata("design:returntype", Promise)
], ConversationsController.prototype, "muteConversation", null);
__decorate([
    (0, common_1.Delete)(':conversationId/mute'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Unmute conversation' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Conversation unmuted' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, common_1.Param)('conversationId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ConversationsController.prototype, "unmuteConversation", null);
__decorate([
    (0, common_1.Post)(':conversationId/archive'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Archive conversation' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Conversation archived' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, common_1.Param)('conversationId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ConversationsController.prototype, "archiveConversation", null);
__decorate([
    (0, common_1.Delete)(':conversationId/archive'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Unarchive conversation' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Conversation unarchived' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, common_1.Param)('conversationId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ConversationsController.prototype, "unarchiveConversation", null);
__decorate([
    (0, common_1.Post)(':conversationId/mark-unread'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Mark conversation as unread' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Conversation marked unread' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, common_1.Param)('conversationId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ConversationsController.prototype, "markUnread", null);
__decorate([
    (0, common_1.Post)(':conversationId/read'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Mark messages as read' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Messages marked as read' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, common_1.Param)('conversationId')),
    __param(1, (0, common_1.Query)('messageId')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], ConversationsController.prototype, "markAsRead", null);
__decorate([
    (0, common_1.Post)(':conversationId/delivered'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Mark message as delivered' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Message marked as delivered' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, common_1.Param)('conversationId')),
    __param(1, (0, common_1.Body)('messageId')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], ConversationsController.prototype, "markAsDelivered", null);
__decorate([
    (0, common_1.Delete)(':conversationId'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete conversation' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Conversation deleted' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('conversationId')),
    __param(1, (0, common_1.Query)('forEveryone')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Boolean, Object]),
    __metadata("design:returntype", Promise)
], ConversationsController.prototype, "deleteConversation", null);
exports.ConversationsController = ConversationsController = __decorate([
    (0, swagger_1.ApiTags)('conversations'),
    (0, common_1.Controller)('conversations'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [conversations_service_1.ConversationsService])
], ConversationsController);
//# sourceMappingURL=conversations.controller.js.map