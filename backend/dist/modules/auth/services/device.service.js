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
exports.DeviceService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("@shared/database/prisma.service");
let DeviceService = class DeviceService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async registerDevice(userId, dto) {
        const device = await this.prisma.device.upsert({
            where: { deviceId: dto.deviceId },
            update: {
                userId,
                platform: dto.platform,
                pushToken: dto.pushToken,
                appVersion: dto.appVersion,
                osVersion: dto.osVersion,
                lastActiveAt: new Date(),
            },
            create: {
                userId,
                deviceId: dto.deviceId,
                platform: dto.platform,
                pushToken: dto.pushToken,
                appVersion: dto.appVersion,
                osVersion: dto.osVersion,
            },
        });
        return device;
    }
    async getUserDevices(userId) {
        return this.prisma.device.findMany({
            where: { userId },
            orderBy: { lastActiveAt: 'desc' },
        });
    }
    async updateDeviceActivity(deviceId) {
        await this.prisma.device.update({
            where: { deviceId },
            data: { lastActiveAt: new Date() },
        });
    }
    async revokeDevice(userId, deviceId) {
        await this.prisma.device.deleteMany({
            where: { userId, deviceId },
        });
    }
    async getDeviceById(deviceId) {
        return this.prisma.device.findUnique({
            where: { deviceId },
            include: { user: true },
        });
    }
    async updatePushToken(deviceId, pushToken) {
        await this.prisma.device.update({
            where: { deviceId },
            data: { pushToken },
        });
    }
};
exports.DeviceService = DeviceService;
exports.DeviceService = DeviceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object])
], DeviceService);
//# sourceMappingURL=device.service.js.map