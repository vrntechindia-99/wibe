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
exports.GroupsController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const groups_service_1 = require("./services/groups.service");
const jwt_auth_guard_1 = require("@shared/guards/jwt-auth.guard");
const create_group_dto_1 = require("./dto/create-group.dto");
const update_group_dto_1 = require("./dto/update-group.dto");
const group_settings_dto_1 = require("./dto/group-settings.dto");
const group_query_dto_1 = require("./dto/group-query.dto");
let GroupsController = class GroupsController {
    constructor(groupsService) {
        this.groupsService = groupsService;
    }
    async getGroups(query, req) {
        const userId = req['user'].sub;
        return this.groupsService.getUserGroups(userId, query);
    }
    async createGroup(dto, req) {
        const userId = req['user'].sub;
        return this.groupsService.createGroup(userId, dto);
    }
    async searchGroups(query, limit, req) {
        const userId = req['user'].sub;
        return this.groupsService.searchGroups(query, userId, limit || 20);
    }
    async getGroup(groupId, req) {
        const userId = req['user'].sub;
        return this.groupsService.getGroup(groupId, userId);
    }
    async updateGroup(groupId, dto, req) {
        const userId = req['user'].sub;
        return this.groupsService.updateGroup(groupId, userId, dto);
    }
    async updateSettings(groupId, dto, req) {
        const userId = req['user'].sub;
        return this.groupsService.updateGroupSettings(groupId, userId, dto);
    }
    async getAvatarUploadUrl(groupId, fileName, contentType, req) {
        const userId = req['user'].sub;
        return this.groupsService.getGroupAvatarUploadUrl(groupId, userId, fileName, contentType);
    }
    async updateAvatar(groupId, avatarUrl, req) {
        const userId = req['user'].sub;
        return this.groupsService.updateGroupAvatar(groupId, userId, avatarUrl);
    }
    async addMembers(groupId, memberIds, req) {
        const userId = req['user'].sub;
        return this.groupsService.addMembers(groupId, userId, memberIds);
    }
    async removeMember(groupId, targetUserId, req) {
        const userId = req['user'].sub;
        return this.groupsService.removeMember(groupId, userId, targetUserId);
    }
    async leaveGroup(groupId, req) {
        const userId = req['user'].sub;
        return this.groupsService.leaveGroup(groupId, userId);
    }
    async promoteAdmin(groupId, targetUserId, req) {
        const userId = req['user'].sub;
        return this.groupsService.promoteAdmin(groupId, userId, targetUserId);
    }
    async demoteAdmin(groupId, targetUserId, req) {
        const userId = req['user'].sub;
        return this.groupsService.demoteAdmin(groupId, userId, targetUserId);
    }
    async getMembers(groupId, page, limit, req) {
        const userId = req['user'].sub;
        return this.groupsService.getGroupMembers(groupId, userId, page || 1, limit || 50);
    }
    async deleteGroup(groupId, req) {
        const userId = req['user'].sub;
        return this.groupsService.deleteGroup(groupId, userId);
    }
};
exports.GroupsController = GroupsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get user groups' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of groups' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [group_query_dto_1.GroupQueryDto, Object]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "getGroups", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new group' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Group created' }),
    openapi.ApiResponse({ status: 201, type: Object }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_group_dto_1.CreateGroupDto, Object]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "createGroup", null);
__decorate([
    (0, common_1.Get)('search'),
    (0, swagger_1.ApiOperation)({ summary: 'Search groups' }),
    (0, swagger_1.ApiQuery)({ name: 'q', required: true }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Group search results' }),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, common_1.Query)('q')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Object]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "searchGroups", null);
__decorate([
    (0, common_1.Get)(':groupId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get group by ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Group details' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('groupId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "getGroup", null);
__decorate([
    (0, common_1.Patch)(':groupId'),
    (0, swagger_1.ApiOperation)({ summary: 'Update group info' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Group updated' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('groupId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_group_dto_1.UpdateGroupDto, Object]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "updateGroup", null);
__decorate([
    (0, common_1.Patch)(':groupId/settings'),
    (0, swagger_1.ApiOperation)({ summary: 'Update group settings' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Settings updated' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('groupId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, group_settings_dto_1.GroupSettingsDto, Object]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "updateSettings", null);
__decorate([
    (0, common_1.Post)(':groupId/avatar/upload-url'),
    (0, swagger_1.ApiOperation)({ summary: 'Get presigned URL for group avatar upload' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Upload URL' }),
    openapi.ApiResponse({ status: 201, type: Object }),
    __param(0, (0, common_1.Param)('groupId')),
    __param(1, (0, common_1.Body)('fileName')),
    __param(2, (0, common_1.Body)('contentType')),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "getAvatarUploadUrl", null);
__decorate([
    Put(':groupId/avatar'),
    (0, swagger_1.ApiOperation)({ summary: 'Update group avatar' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Avatar updated' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('groupId')),
    __param(1, (0, common_1.Body)('avatarUrl')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "updateAvatar", null);
__decorate([
    (0, common_1.Post)(':groupId/members'),
    (0, swagger_1.ApiOperation)({ summary: 'Add members to group' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Members added' }),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Param)('groupId')),
    __param(1, (0, common_1.Body)('memberIds')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Array, Object]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "addMembers", null);
__decorate([
    (0, common_1.Delete)(':groupId/members/:userId'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Remove member from group' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Member removed' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, common_1.Param)('groupId')),
    __param(1, (0, common_1.Param)('userId')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "removeMember", null);
__decorate([
    (0, common_1.Post)(':groupId/leave'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Leave group' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Left group' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, common_1.Param)('groupId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "leaveGroup", null);
__decorate([
    (0, common_1.Post)(':groupId/members/:userId/promote'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Promote member to admin' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Member promoted' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, common_1.Param)('groupId')),
    __param(1, (0, common_1.Param)('userId')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "promoteAdmin", null);
__decorate([
    (0, common_1.Post)(':groupId/members/:userId/demote'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Demote admin to member' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Admin demoted' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, common_1.Param)('groupId')),
    __param(1, (0, common_1.Param)('userId')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "demoteAdmin", null);
__decorate([
    (0, common_1.Get)(':groupId/members'),
    (0, swagger_1.ApiOperation)({ summary: 'Get group members' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Group members' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('groupId')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Number, Object]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "getMembers", null);
__decorate([
    (0, common_1.Delete)(':groupId'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete group (owner only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Group deleted' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('groupId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "deleteGroup", null);
exports.GroupsController = GroupsController = __decorate([
    (0, swagger_1.ApiTags)('groups'),
    (0, common_1.Controller)('groups'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [groups_service_1.GroupsService])
], GroupsController);
//# sourceMappingURL=groups.controller.js.map