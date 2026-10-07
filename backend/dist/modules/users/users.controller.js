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
exports.UsersController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const users_service_1 = require("./users.service");
const profile_service_1 = require("./services/profile.service");
const privacy_service_1 = require("./services/privacy.service");
const block_service_1 = require("./services/block.service");
const jwt_auth_guard_1 = require("@shared/guards/jwt-auth.guard");
const update_profile_dto_1 = require("./dto/update-profile.dto");
const update_avatar_dto_1 = require("./dto/update-avatar.dto");
const update_privacy_dto_1 = require("./dto/update-privacy.dto");
let UsersController = class UsersController {
    constructor(usersService, profileService, privacyService, blockService) {
        this.usersService = usersService;
        this.profileService = profileService;
        this.privacyService = privacyService;
        this.blockService = blockService;
    }
    async getMe(req) {
        const userId = req['user'].sub;
        return this.usersService.findById(userId);
    }
    async searchUsers(query, limit, req) {
        const userId = req['user'].sub;
        return this.usersService.searchUsers(query, userId, limit || 20);
    }
    async getUser(userId, req) {
        const requesterId = req['user'].sub;
        return this.usersService.getUserProfile(userId, requesterId);
    }
    async updateProfile(dto, req) {
        const userId = req['user'].sub;
        return this.profileService.updateProfile(userId, dto);
    }
    async getAvatarUploadUrl(dto, req) {
        const userId = req['user'].sub;
        return this.profileService.getAvatarUploadUrl(userId, dto);
    }
    async confirmAvatar(avatarUrl, req) {
        const userId = req['user'].sub;
        return this.profileService.confirmAvatarUpload(userId, avatarUrl);
    }
    async deleteAvatar(req) {
        const userId = req['user'].sub;
        return this.profileService.deleteAvatar(userId);
    }
    async getPrivacySettings(req) {
        const userId = req['user'].sub;
        return this.privacyService.getPrivacySettings(userId);
    }
    async updatePrivacySettings(dto, req) {
        const userId = req['user'].sub;
        return this.privacyService.updatePrivacySettings(userId, dto);
    }
    async blockUser(blockedId, req) {
        const blockerId = req['user'].sub;
        return this.blockService.blockUser(blockerId, blockedId);
    }
    async unblockUser(blockedId, req) {
        const blockerId = req['user'].sub;
        return this.blockService.unblockUser(blockerId, blockedId);
    }
    async getBlockedUsers(req) {
        const userId = req['user'].sub;
        return this.blockService.getBlockedUsers(userId);
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, common_1.Get)('me'),
    (0, swagger_1.ApiOperation)({ summary: 'Get current user profile' }),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getMe", null);
__decorate([
    (0, common_1.Get)('search'),
    (0, swagger_1.ApiOperation)({ summary: 'Search users' }),
    (0, swagger_1.ApiQuery)({ name: 'q', required: true }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number }),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, common_1.Query)('q')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "searchUsers", null);
__decorate([
    (0, common_1.Get)(':userId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get user profile by ID' }),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getUser", null);
__decorate([
    (0, common_1.Put)('profile'),
    (0, swagger_1.ApiOperation)({ summary: 'Update profile' }),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [update_profile_dto_1.UpdateProfileDto, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "updateProfile", null);
__decorate([
    (0, common_1.Post)('avatar/upload-url'),
    (0, swagger_1.ApiOperation)({ summary: 'Get presigned URL for avatar upload' }),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [update_avatar_dto_1.UpdateAvatarDto, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getAvatarUploadUrl", null);
__decorate([
    (0, common_1.Put)('avatar'),
    (0, swagger_1.ApiOperation)({ summary: 'Confirm avatar upload' }),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, common_1.Body)('avatarUrl')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "confirmAvatar", null);
__decorate([
    (0, common_1.Delete)('avatar'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete avatar' }),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "deleteAvatar", null);
__decorate([
    (0, common_1.Get)('privacy/settings'),
    (0, swagger_1.ApiOperation)({ summary: 'Get privacy settings' }),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getPrivacySettings", null);
__decorate([
    (0, common_1.Put)('privacy/settings'),
    (0, swagger_1.ApiOperation)({ summary: 'Update privacy settings' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [update_privacy_dto_1.UpdatePrivacyDto, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "updatePrivacySettings", null);
__decorate([
    (0, common_1.Post)('block/:userId'),
    (0, swagger_1.ApiOperation)({ summary: 'Block a user' }),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "blockUser", null);
__decorate([
    (0, common_1.Delete)('block/:userId'),
    (0, swagger_1.ApiOperation)({ summary: 'Unblock a user' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "unblockUser", null);
__decorate([
    (0, common_1.Get)('blocked'),
    (0, swagger_1.ApiOperation)({ summary: 'Get blocked users' }),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getBlockedUsers", null);
exports.UsersController = UsersController = __decorate([
    (0, swagger_1.ApiTags)('users'),
    (0, common_1.Controller)('users'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        profile_service_1.ProfileService,
        privacy_service_1.PrivacyService,
        block_service_1.BlockService])
], UsersController);
//# sourceMappingURL=users.controller.js.map