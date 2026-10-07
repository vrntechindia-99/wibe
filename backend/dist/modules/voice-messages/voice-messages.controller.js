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
exports.VoiceMessagesController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const voice_messages_service_1 = require("./services/voice-messages.service");
const jwt_auth_guard_1 = require("@shared/guards/jwt-auth.guard");
let VoiceMessagesController = class VoiceMessagesController {
    constructor(voiceMessagesService) {
        this.voiceMessagesService = voiceMessagesService;
    }
    async getVoiceMessage(messageId, req) {
        const userId = req['user'].sub;
        return this.voiceMessagesService.getVoiceMessage(messageId, userId);
    }
    async getVoiceMessagesInConversation(conversationId, req) {
        const userId = req['user'].sub;
        return this.voiceMessagesService.getVoiceMessagesInConversation(conversationId, userId);
    }
    async deleteVoiceMessage(messageId, req) {
        const userId = req['user'].sub;
        return this.voiceMessagesService.deleteVoiceMessage(messageId, userId);
    }
};
exports.VoiceMessagesController = VoiceMessagesController;
__decorate([
    (0, common_1.Get)(':messageId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get voice message details' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Voice message with download URL' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('messageId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], VoiceMessagesController.prototype, "getVoiceMessage", null);
__decorate([
    (0, common_1.Get)('conversation/:conversationId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all voice messages in conversation' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of voice messages' }),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, common_1.Param)('conversationId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], VoiceMessagesController.prototype, "getVoiceMessagesInConversation", null);
__decorate([
    (0, common_1.Delete)(':messageId'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete voice message' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Voice message deleted' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('messageId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], VoiceMessagesController.prototype, "deleteVoiceMessage", null);
exports.VoiceMessagesController = VoiceMessagesController = __decorate([
    (0, swagger_1.ApiTags)('voice-messages'),
    (0, common_1.Controller)('voice-messages'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [voice_messages_service_1.VoiceMessagesService])
], VoiceMessagesController);
//# sourceMappingURL=voice-messages.controller.js.map