import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '@shared/database/redis.service';

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);
  private readonly otpTtl = 300; // 5 minutes
  private readonly maxAttempts = 3;

  constructor(
    private readonly configService: ConfigService,
    private readonly redis: RedisService,
  ) {}

  async sendOtp(phoneNumber: string): Promise<void> {
    const devMode = this.configService.get<string>('DEV_MODE') === 'true';
    const devOtp = this.configService.get<string>('DEV_OTP_CODE') || '123456';

    let otp: string;
    if (devMode) {
      otp = devOtp;
      this.logger.log(`[DEV MODE] OTP for ${phoneNumber}: ${otp}`);
    } else {
      otp = this.generateOtp();
      // TODO: Integrate with SMS provider (Twilio, etc.)
      this.logger.log(`[PROD] Would send OTP ${otp} to ${phoneNumber}`);
    }

    const key = `otp:${phoneNumber}`;
    await this.redis.set(key, otp, this.otpTtl);

    // Track attempts
    const attemptsKey = `otp_attempts:${phoneNumber}`;
    await this.redis.set(attemptsKey, '0', this.otpTtl);
  }

  async verifyOtp(phoneNumber: string, otp: string): Promise<boolean> {
    const key = `otp:${phoneNumber}`;
    const storedOtp = await this.redis.get(key);

    if (!storedOtp) {
      return false;
    }

    // Check attempts
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
    } else {
      await this.redis.set(attemptsKey, (attempts + 1).toString(), this.otpTtl);
    }

    return isValid;
  }

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}