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
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfileService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("@shared/database/prisma.service");
const minio_service_1 = require("@modules/media/minio.service");
let ProfileService = class ProfileService {
    constructor(prisma, minioService) {
        this.prisma = prisma;
        this.minioService = minioService;
    }
    async getProfile(userId) {
        const profile = await this.prisma.userProfile.findUnique({
            where: { userId },
        });
        if (!profile) {
            throw new common_1.NotFoundException('Profile not found');
        }
        return profile;
    }
    async updateProfile(userId, dto) {
        const profile = await this.prisma.userProfile.upsert({
            where: { userId },
            update: {
                displayName: dto.displayName,
                about: dto.about,
            },
            create: {
                userId,
                displayName: dto.displayName,
                about: dto.about,
            },
        });
        return profile;
    }
    async getAvatarUploadUrl(userId, dto) {
        const fileName = `avatars/${userId}/${Date.now()}-${dto.fileName}`;
        const uploadUrl = await this.minioService.getPresignedUploadUrl(fileName, dto.contentType);
        const downloadUrl = await this.minioService.getPresignedDownloadUrl(fileName);
        return { uploadUrl, downloadUrl, fileName };
    }
    async confirmAvatarUpload(userId, avatarUrl) {
        const profile = await this.prisma.userProfile.update({
            where: { userId },
            data: { avatarUrl },
        });
        return profile;
    }
    async deleteAvatar(userId) {
        const profile = await this.prisma.userProfile.update({
            where: { userId },
            data: { avatarUrl: null },
        });
        return profile;
    }
};
exports.ProfileService = ProfileService;
exports.ProfileService = ProfileService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object, typeof (_b = typeof minio_service_1.MinioService !== "undefined" && minio_service_1.MinioService) === "function" ? _b : Object])
], ProfileService);
//# sourceMappingURL=profile.service.js.map