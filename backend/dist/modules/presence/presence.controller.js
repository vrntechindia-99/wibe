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
exports.PresenceController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const presence_service_1 = require("./presence.service");
const jwt_auth_guard_1 = require("@shared/guards/jwt-auth.guard");
let PresenceController = class PresenceController {
    constructor(presenceService) {
        this.presenceService = presenceService;
    }
    async getUserPresence(userId, req) {
        const requesterId = req['user'].sub;
        return this.presenceService.getPresence(userId, requesterId);
    }
    async getUsersPresence(ids, req) {
        const requesterId = req['user'].sub;
        const userIds = ids.split(',').filter(Boolean);
        return this.presenceService.getOnlineUsers(userIds, requesterId);
    }
    async getConversationPresence(conversationId, req) {
        const userId = req['user'].sub;
        return this.presenceService.getConversationPresence(conversationId, userId);
    }
};
exports.PresenceController = PresenceController;
__decorate([
    (0, common_1.Get)('user/:userId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get user presence' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'User presence' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PresenceController.prototype, "getUserPresence", null);
__decorate([
    (0, common_1.Get)('users'),
    (0, swagger_1.ApiOperation)({ summary: 'Get multiple users presence' }),
    (0, swagger_1.ApiQuery)({ name: 'ids', required: true, description: 'Comma-separated user IDs' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Users presence' }),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, common_1.Query)('ids')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PresenceController.prototype, "getUsersPresence", null);
__decorate([
    (0, common_1.Get)('conversation/:conversationId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get conversation members presence' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Conversation members presence' }),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, common_1.Param)('conversationId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PresenceController.prototype, "getConversationPresence", null);
exports.PresenceController = PresenceController = __decorate([
    (0, swagger_1.ApiTags)('presence'),
    (0, common_1.Controller)('presence'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [presence_service_1.PresenceService])
], PresenceController);
//# sourceMappingURL=presence.controller.js.map