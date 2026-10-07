import { PrismaService } from '@shared/database/prisma.service';
import { RedisService } from '@shared/database/redis.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { TokenService } from './services/token.service';
import { DeviceService } from './services/device.service';
import { SessionService } from './services/session.service';
import { OtpService } from './services/otp.service';
import { RegisterDto } from './dto/register.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { DeviceDto } from './dto/device.dto';
export declare class AuthService {
    private readonly prisma;
    private readonly redis;
    private readonly jwtService;
    private readonly configService;
    private readonly tokenService;
    private readonly deviceService;
    private readonly sessionService;
    private readonly otpService;
    constructor(prisma: PrismaService, redis: RedisService, jwtService: JwtService, configService: ConfigService, tokenService: TokenService, deviceService: DeviceService, sessionService: SessionService, otpService: OtpService);
    register(dto: RegisterDto, deviceDto: DeviceDto): Promise<{
        message: string;
        userId?: undefined;
    } | {
        message: string;
        userId: any;
    }>;
    verifyOtp(dto: VerifyOtpDto, deviceDto: DeviceDto): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
            id: any;
            phoneNumber: any;
            isVerified: boolean;
        };
    }>;
    login(dto: LoginDto, deviceDto: DeviceDto): Promise<{
        message: string;
        userId: any;
    }>;
    verifyLoginOtp(dto: VerifyOtpDto, deviceDto: DeviceDto): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
            id: any;
            phoneNumber: any;
            isVerified: any;
            profile: any;
        };
    }>;
    refreshTokens(dto: RefreshTokenDto): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    logout(userId: string, deviceId: string): Promise<{
        message: string;
    }>;
    logoutAllDevices(userId: string): Promise<{
        message: string;
    }>;
    deleteAccount(userId: string): Promise<{
        message: string;
    }>;
    getProfile(userId: string): Promise<any>;
}
