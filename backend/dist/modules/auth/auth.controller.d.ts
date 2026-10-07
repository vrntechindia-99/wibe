import { Request } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { DeviceDto } from './dto/device.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
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
    refresh(dto: RefreshTokenDto): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    logout(req: Request, deviceDto: DeviceDto): Promise<{
        message: string;
    }>;
    logoutAll(req: Request): Promise<{
        message: string;
    }>;
    deleteAccount(req: Request): Promise<{
        message: string;
    }>;
    getProfile(req: Request): Promise<any>;
}
