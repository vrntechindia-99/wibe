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
exports.TokenService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const uuid_1 = require("uuid");
let TokenService = class TokenService {
    constructor(jwtService, configService) {
        this.jwtService = jwtService;
        this.configService = configService;
    }
    async generateTokens(userId, deviceId) {
        const sessionId = (0, uuid_1.v4)();
        const accessToken = await this.generateAccessToken(userId, deviceId, sessionId);
        const refreshToken = await this.generateRefreshToken(userId, deviceId, sessionId);
        return { accessToken, refreshToken };
    }
    async generateAccessToken(userId, deviceId, sessionId) {
        const payload = {
            sub: userId,
            deviceId,
            sessionId,
            type: 'access',
        };
        return this.jwtService.signAsync(payload, {
            secret: this.configService.get('JWT_ACCESS_SECRET'),
            expiresIn: this.configService.get('JWT_ACCESS_EXPIRY') || '15m',
        });
    }
    async generateRefreshToken(userId, deviceId, sessionId) {
        const payload = {
            sub: userId,
            deviceId,
            sessionId,
            type: 'refresh',
        };
        return this.jwtService.signAsync(payload, {
            secret: this.configService.get('JWT_REFRESH_SECRET'),
            expiresIn: this.configService.get('JWT_REFRESH_EXPIRY') || '30d',
        });
    }
    async verifyAccessToken(token) {
        try {
            return await this.jwtService.verifyAsync(token, {
                secret: this.configService.get('JWT_ACCESS_SECRET'),
            });
        }
        catch {
            return null;
        }
    }
    async verifyRefreshToken(token) {
        try {
            return await this.jwtService.verifyAsync(token, {
                secret: this.configService.get('JWT_REFRESH_SECRET'),
            });
        }
        catch {
            return null;
        }
    }
    decodeToken(token) {
        try {
            return this.jwtService.decode(token);
        }
        catch {
            return null;
        }
    }
};
exports.TokenService = TokenService;
exports.TokenService = TokenService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jwt_1.JwtService, typeof (_a = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _a : Object])
], TokenService);
//# sourceMappingURL=token.service.js.map