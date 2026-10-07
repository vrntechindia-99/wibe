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
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("@shared/database/prisma.service");
const redis_service_1 = require("@shared/database/redis.service");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const token_service_1 = require("./services/token.service");
const device_service_1 = require("./services/device.service");
const session_service_1 = require("./services/session.service");
const otp_service_1 = require("./services/otp.service");
let AuthService = class AuthService {
    constructor(prisma, redis, jwtService, configService, tokenService, deviceService, sessionService, otpService) {
        this.prisma = prisma;
        this.redis = redis;
        this.jwtService = jwtService;
        this.configService = configService;
        this.tokenService = tokenService;
        this.deviceService = deviceService;
        this.sessionService = sessionService;
        this.otpService = otpService;
    }
    async register(dto, deviceDto) {
        const existingUser = await this.prisma.user.findUnique({
            where: { phoneNumber: dto.phoneNumber },
        });
        if (existingUser) {
            if (existingUser.isVerified) {
                throw new common_1.ConflictException('Phone number already registered');
            }
            await this.otpService.sendOtp(dto.phoneNumber);
            return { message: 'OTP sent. Please verify your phone number.' };
        }
        const user = await this.prisma.user.create({
            data: {
                phoneNumber: dto.phoneNumber,
                isVerified: false,
            },
        });
        await this.otpService.sendOtp(dto.phoneNumber);
        return { message: 'OTP sent. Please verify your phone number.', userId: user.id };
    }
    async verifyOtp(dto, deviceDto) {
        const user = await this.prisma.user.findUnique({
            where: { phoneNumber: dto.phoneNumber },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        if (user.isVerified) {
            throw new common_1.ConflictException('User already verified. Please login.');
        }
        const isValid = await this.otpService.verifyOtp(dto.phoneNumber, dto.otp);
        if (!isValid) {
            throw new common_1.UnauthorizedException('Invalid or expired OTP');
        }
        await this.prisma.user.update({
            where: { id: user.id },
            data: { isVerified: true },
        });
        await this.prisma.userProfile.create({
            data: { userId: user.id },
        });
        const device = await this.deviceService.registerDevice(user.id, deviceDto);
        const tokens = await this.tokenService.generateTokens(user.id, device.id);
        await this.sessionService.createSession(user.id, device.id, tokens.refreshToken);
        return {
            user: { id: user.id, phoneNumber: user.phoneNumber, isVerified: true },
            ...tokens,
        };
    }
    async login(dto, deviceDto) {
        const user = await this.prisma.user.findUnique({
            where: { phoneNumber: dto.phoneNumber },
        });
        if (!user || !user.isVerified) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        await this.otpService.sendOtp(dto.phoneNumber);
        return { message: 'OTP sent. Please verify to login.', userId: user.id };
    }
    async verifyLoginOtp(dto, deviceDto) {
        const user = await this.prisma.user.findUnique({
            where: { phoneNumber: dto.phoneNumber },
        });
        if (!user || !user.isVerified) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const isValid = await this.otpService.verifyOtp(dto.phoneNumber, dto.otp);
        if (!isValid) {
            throw new common_1.UnauthorizedException('Invalid or expired OTP');
        }
        const device = await this.deviceService.registerDevice(user.id, deviceDto);
        const tokens = await this.tokenService.generateTokens(user.id, device.id);
        await this.sessionService.createSession(user.id, device.id, tokens.refreshToken);
        const profile = await this.prisma.userProfile.findUnique({
            where: { userId: user.id },
        });
        return {
            user: {
                id: user.id,
                phoneNumber: user.phoneNumber,
                isVerified: user.isVerified,
                profile,
            },
            ...tokens,
        };
    }
    async refreshTokens(dto) {
        const payload = await this.tokenService.verifyRefreshToken(dto.refreshToken);
        if (!payload) {
            throw new common_1.UnauthorizedException('Invalid refresh token');
        }
        const session = await this.sessionService.findSession(payload.sessionId);
        if (!session || session.revokedAt) {
            throw new common_1.UnauthorizedException('Session revoked');
        }
        const tokens = await this.tokenService.generateTokens(payload.sub, payload.deviceId);
        await this.sessionService.updateSession(session.id, tokens.refreshToken);
        return tokens;
    }
    async logout(userId, deviceId) {
        await this.sessionService.revokeSession(userId, deviceId);
        return { message: 'Logged out successfully' };
    }
    async logoutAllDevices(userId) {
        await this.sessionService.revokeAllSessions(userId);
        return { message: 'Logged out from all devices' };
    }
    async deleteAccount(userId) {
        await this.prisma.user.update({
            where: { id: userId },
            data: { deletedAt: new Date() },
        });
        await this.sessionService.revokeAllSessions(userId);
        return { message: 'Account scheduled for deletion' };
    }
    async getProfile(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { profile: true },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const { password, ...safeUser } = user;
        return safeUser;
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object, typeof (_b = typeof redis_service_1.RedisService !== "undefined" && redis_service_1.RedisService) === "function" ? _b : Object, jwt_1.JwtService, typeof (_c = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _c : Object, token_service_1.TokenService,
        device_service_1.DeviceService,
        session_service_1.SessionService,
        otp_service_1.OtpService])
], AuthService);
//# sourceMappingURL=auth.service.js.map