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
exports.WsJwtGuard = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
let WsJwtGuard = class WsJwtGuard {
    constructor(jwtService, configService) {
        this.jwtService = jwtService;
        this.configService = configService;
    }
    async canActivate(context) {
        const client = context.switchToWs().getClient();
        const token = this.extractTokenFromHandshake(client);
        if (!token) {
            throw new common_1.UnauthorizedException('Authentication token required');
        }
        try {
            const secret = this.configService.get('JWT_ACCESS_SECRET');
            const payload = await this.jwtService.verifyAsync(token, { secret });
            client['user'] = payload;
        }
        catch {
            throw new common_1.UnauthorizedException('Invalid or expired token');
        }
        return true;
    }
    extractTokenFromHandshake(client) {
        const auth = client.handshake?.auth;
        if (auth?.token) {
            return auth.token;
        }
        const query = client.handshake?.query;
        if (query?.token) {
            return query.token;
        }
        const headers = client.handshake?.headers;
        if (headers?.authorization) {
            const [type, token] = headers.authorization.split(' ');
            if (type === 'Bearer') {
                return token;
            }
        }
        return undefined;
    }
};
exports.WsJwtGuard = WsJwtGuard;
exports.WsJwtGuard = WsJwtGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jwt_1.JwtService, typeof (_a = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _a : Object])
], WsJwtGuard);
//# sourceMappingURL=ws-jwt.guard.js.map