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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrivacyService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("@shared/database/prisma.service");
const client_1 = require("@prisma/client");
let PrivacyService = class PrivacyService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getPrivacySettings(userId) {
        const profile = await this.prisma.userProfile.findUnique({
            where: { userId },
            select: {
                privacyLastSeen: true,
                privacyProfilePhoto: true,
                privacyAbout: true,
                privacyReadReceipts: true,
                privacyStatus: true,
                privacyGroups: true,
            },
        });
        if (!profile) {
            throw new common_1.NotFoundException('Profile not found');
        }
        return profile;
    }
    async updatePrivacySettings(userId, dto) {
        const profile = await this.prisma.userProfile.update({
            where: { userId },
            data: {
                privacyLastSeen: dto.lastSeen,
                privacyProfilePhoto: dto.profilePhoto,
                privacyAbout: dto.about,
                privacyReadReceipts: dto.readReceipts,
                privacyStatus: dto.status,
                privacyGroups: dto.groups,
            },
        });
        return {
            lastSeen: profile.privacyLastSeen,
            profilePhoto: profile.privacyProfilePhoto,
            about: profile.privacyAbout,
            readReceipts: profile.privacyReadReceipts,
            status: profile.privacyStatus,
            groups: profile.privacyGroups,
        };
    }
    async canViewLastSeen(targetUserId, requesterId) {
        if (targetUserId === requesterId)
            return true;
        const profile = await this.prisma.userProfile.findUnique({
            where: { userId: targetUserId },
            select: { privacyLastSeen: true },
        });
        if (!profile)
            return false;
        return this.checkPrivacyLevel(profile.privacyLastSeen, targetUserId, requesterId);
    }
    async canViewProfilePhoto(targetUserId, requesterId) {
        if (targetUserId === requesterId)
            return true;
        const profile = await this.prisma.userProfile.findUnique({
            where: { userId: targetUserId },
            select: { privacyProfilePhoto: true },
        });
        if (!profile)
            return false;
        return this.checkPrivacyLevel(profile.privacyProfilePhoto, targetUserId, requesterId);
    }
    async canViewAbout(targetUserId, requesterId) {
        if (targetUserId === requesterId)
            return true;
        const profile = await this.prisma.userProfile.findUnique({
            where: { userId: targetUserId },
            select: { privacyAbout: true },
        });
        if (!profile)
            return false;
        return this.checkPrivacyLevel(profile.privacyAbout, targetUserId, requesterId);
    }
    async canViewStatus(targetUserId, requesterId) {
        if (targetUserId === requesterId)
            return true;
        const profile = await this.prisma.userProfile.findUnique({
            where: { userId: targetUserId },
            select: { privacyStatus: true },
        });
        if (!profile)
            return false;
        return this.checkPrivacyLevel(profile.privacyStatus, targetUserId, requesterId);
    }
    async canViewReadReceipts(targetUserId) {
        const profile = await this.prisma.userProfile.findUnique({
            where: { userId: targetUserId },
            select: { privacyReadReceipts: true },
        });
        return profile?.privacyReadReceipts ?? true;
    }
    async canAddToGroup(targetUserId, requesterId) {
        if (targetUserId === requesterId)
            return true;
        const profile = await this.prisma.userProfile.findUnique({
            where: { userId: targetUserId },
            select: { privacyGroups: true },
        });
        if (!profile)
            return false;
        return this.checkPrivacyLevel(profile.privacyGroups, targetUserId, requesterId);
    }
    async checkPrivacyLevel(level, targetUserId, requesterId) {
        switch (level) {
            case client_1.PrivacyLevel.EVERYONE:
                return true;
            case client_1.PrivacyLevel.NONE:
                return false;
            case client_1.PrivacyLevel.CONTACTS:
                return this.areContacts(targetUserId, requesterId);
            case client_1.PrivacyLevel.CONTACTS_EXCEPT:
                return this.areContacts(targetUserId, requesterId) && !(await this.isExcepted(targetUserId, requesterId));
            case client_1.PrivacyLevel.SELECTED:
                return this.isSelected(targetUserId, requesterId);
            default:
                return false;
        }
    }
    async areContacts(userId1, userId2) {
        const conversation = await this.prisma.conversation.findFirst({
            where: {
                type: 'DIRECT',
                members: {
                    every: {
                        userId: { in: [userId1, userId2] },
                    },
                },
            },
        });
        return !!conversation;
    }
    async isExcepted(targetUserId, requesterId) {
        return false;
    }
    async isSelected(targetUserId, requesterId) {
        const profile = await this.prisma.userProfile.findUnique({
            where: { userId: targetUserId },
            select: {},
        });
        return false;
    }
};
exports.PrivacyService = PrivacyService;
exports.PrivacyService = PrivacyService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object])
], PrivacyService);
//# sourceMappingURL=privacy.service.js.map