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
var OtpService_1;
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OtpService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const redis_service_1 = require("@shared/database/redis.service");
let OtpService = OtpService_1 = class OtpService {
    constructor(configService, redis) {
        this.configService = configService;
        this.redis = redis;
        this.logger = new common_1.Logger(OtpService_1.name);
        this.otpTtl = 300;
        this.maxAttempts = 3;
    }
    async sendOtp(phoneNumber) {
        const devMode = this.configService.get('DEV_MODE') === 'true';
        const devOtp = this.configService.get('DEV_OTP_CODE') || '123456';
        let otp;
        if (devMode) {
            otp = devOtp;
            this.logger.log(`[DEV MODE] OTP for ${phoneNumber}: ${otp}`);
        }
        else {
            otp = this.generateOtp();
            this.logger.log(`[PROD] Would send OTP ${otp} to ${phoneNumber}`);
        }
        const key = `otp:${phoneNumber}`;
        await this.redis.set(key, otp, this.otpTtl);
        const attemptsKey = `otp_attempts:${phoneNumber}`;
        await this.redis.set(attemptsKey, '0', this.otpTtl);
    }
    async verifyOtp(phoneNumber, otp) {
        const key = `otp:${phoneNumber}`;
        const storedOtp = await this.redis.get(key);
        if (!storedOtp) {
            return false;
        }
        const attemptsKey = `otp_attempts:${phoneNumber}`;
        const attempts = parseInt(await this.redis.get(attemptsKey) || '0', 10);
        if (attempts >= this.maxAttempts) {
            await this.redis.del(key);
            await this.redis.del(attemptsKey);
            return false;
        }
        const isValid = storedOtp === otp;
        if (isValid) {
            await this.redis.del(key);
            await this.redis.del(attemptsKey);
        }
        else {
            await this.redis.set(attemptsKey, (attempts + 1).toString(), this.otpTtl);
        }
        return isValid;
    }
    generateOtp() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }
};
exports.OtpService = OtpService;
exports.OtpService = OtpService = OtpService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _a : Object, typeof (_b = typeof redis_service_1.RedisService !== "undefined" && redis_service_1.RedisService) === "function" ? _b : Object])
], OtpService);
//# sourceMappingURL=otp.service.js.map