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
exports.MessagesController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const messages_service_1 = require("./services/messages.service");
const jwt_auth_guard_1 = require("@shared/guards/jwt-auth.guard");
const send_message_dto_1 = require("./dto/send-message.dto");
const update_message_dto_1 = require("./dto/update-message.dto");
const message_query_dto_1 = require("./dto/message-query.dto");
let MessagesController = class MessagesController {
    constructor(messagesService) {
        this.messagesService = messagesService;
    }
    async sendMessage(conversationId, dto, req) {
        const senderId = req['user'].sub;
        return this.messagesService.sendMessage(conversationId, senderId, dto);
    }
    async getMessages(conversationId, query, req) {
        const userId = req['user'].sub;
        return this.messagesService.getMessages(conversationId, userId, query);
    }
    async searchMessages(conversationId, query, limit, req) {
        const userId = req['user'].sub;
        return this.messagesService.searchMessages(userId, query, conversationId, limit || 20);
    }
    async getMessage(conversationId, messageId, req) {
        const userId = req['user'].sub;
        return this.messagesService.getMessage(messageId, userId);
    }
    async updateMessage(conversationId, messageId, dto, req) {
        const userId = req['user'].sub;
        return this.messagesService.updateMessage(messageId, userId, dto);
    }
    async deleteMessage(conversationId, messageId, forEveryone, req) {
        const userId = req['user'].sub;
        return this.messagesService.deleteMessage(messageId, userId, forEveryone || false);
    }
};
exports.MessagesController = MessagesController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Send a message' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Message sent' }),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Param)('conversationId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, send_message_dto_1.SendMessageDto, Object]),
    __metadata("design:returntype", Promise)
], MessagesController.prototype, "sendMessage", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get messages in conversation' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of messages' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('conversationId')),
    __param(1, (0, common_1.Query)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, message_query_dto_1.MessageQueryDto, Object]),
    __metadata("design:returntype", Promise)
], MessagesController.prototype, "getMessages", null);
__decorate([
    (0, common_1.Get)('search'),
    (0, swagger_1.ApiOperation)({ summary: 'Search messages in conversation' }),
    (0, swagger_1.ApiQuery)({ name: 'q', required: true }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Search results' }),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, common_1.Param)('conversationId')),
    __param(1, (0, common_1.Query)('q')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Number, Object]),
    __metadata("design:returntype", Promise)
], MessagesController.prototype, "searchMessages", null);
__decorate([
    (0, common_1.Get)(':messageId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get message by ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Message details' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('conversationId')),
    __param(1, (0, common_1.Param)('messageId')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], MessagesController.prototype, "getMessage", null);
__decorate([
    (0, common_1.Patch)(':messageId'),
    (0, swagger_1.ApiOperation)({ summary: 'Update message' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Message updated' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('conversationId')),
    __param(1, (0, common_1.Param)('messageId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, update_message_dto_1.UpdateMessageDto, Object]),
    __metadata("design:returntype", Promise)
], MessagesController.prototype, "updateMessage", null);
__decorate([
    (0, common_1.Delete)(':messageId'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Delete message' }),
    (0, swagger_1.ApiQuery)({ name: 'forEveryone', required: false, type: Boolean }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Message deleted' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, common_1.Param)('conversationId')),
    __param(1, (0, common_1.Param)('messageId')),
    __param(2, (0, common_1.Query)('forEveryone')),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Boolean, Object]),
    __metadata("design:returntype", Promise)
], MessagesController.prototype, "deleteMessage", null);
exports.MessagesController = MessagesController = __decorate([
    (0, swagger_1.ApiTags)('messages'),
    (0, common_1.Controller)('conversations/:conversationId/messages'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [messages_service_1.MessagesService])
], MessagesController);
//# sourceMappingURL=messages.controller.js.map