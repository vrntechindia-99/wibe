import { ConfigService } from '@nestjs/config';
import { RedisService } from '@shared/database/redis.service';
export declare class OtpService {
    private readonly configService;
    private readonly redis;
    private readonly logger;
    private readonly otpTtl;
    private readonly maxAttempts;
    constructor(configService: ConfigService, redis: RedisService);
    sendOtp(phoneNumber: string): Promise<void>;
    verifyOtp(phoneNumber: string, otp: string): Promise<boolean>;
    private generateOtp;
}
