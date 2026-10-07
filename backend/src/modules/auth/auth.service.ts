import { Injectable, UnauthorizedException, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@shared/database/prisma.service';
import { RedisService } from '@shared/database/redis.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

import { TokenService } from './services/token.service';
import { DeviceService } from './services/device.service';
import { SessionService } from './services/session.service';
import { OtpService } from './services/otp.service';

import { RegisterDto } from './dto/register.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { DeviceDto } from './dto/device.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly tokenService: TokenService,
    private readonly deviceService: DeviceService,
    private readonly sessionService: SessionService,
    private readonly otpService: OtpService,
  ) {}

  async register(dto: RegisterDto, deviceDto: DeviceDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { phoneNumber: dto.phoneNumber },
    });

    if (existingUser) {
      if (existingUser.isVerified) {
        throw new ConflictException('Phone number already registered');
      }
      // Resend OTP for unverified user
      await this.otpService.sendOtp(dto.phoneNumber);
      return { message: 'OTP sent. Please verify your phone number.' };
    }

    // Create unverified user
    const user = await this.prisma.user.create({
      data: {
        phoneNumber: dto.phoneNumber,
        isVerified: false,
      },
    });

    // Send OTP
    await this.otpService.sendOtp(dto.phoneNumber);

    return { message: 'OTP sent. Please verify your phone number.', userId: user.id };
  }

  async verifyOtp(dto: VerifyOtpDto, deviceDto: DeviceDto) {
    const user = await this.prisma.user.findUnique({
      where: { phoneNumber: dto.phoneNumber },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.isVerified) {
      throw new ConflictException('User already verified. Please login.');
    }

    // Verify OTP
    const isValid = await this.otpService.verifyOtp(dto.phoneNumber, dto.otp);
    if (!isValid) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    // Mark user as verified
    await this.prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true },
    });

    // Create profile
    await this.prisma.userProfile.create({
      data: { userId: user.id },
    });

    // Register device and create session
    const device = await this.deviceService.registerDevice(user.id, deviceDto);
    const tokens = await this.tokenService.generateTokens(user.id, device.id);
    await this.sessionService.createSession(user.id, device.id, tokens.refreshToken);

    return {
      user: { id: user.id, phoneNumber: user.phoneNumber, isVerified: true },
      ...tokens,
    };
  }

  async login(dto: LoginDto, deviceDto: DeviceDto) {
    const user = await this.prisma.user.findUnique({
      where: { phoneNumber: dto.phoneNumber },
    });

    if (!user || !user.isVerified) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // For passwordless login, we send OTP
    await this.otpService.sendOtp(dto.phoneNumber);

    return { message: 'OTP sent. Please verify to login.', userId: user.id };
  }

  async verifyLoginOtp(dto: VerifyOtpDto, deviceDto: DeviceDto) {
    const user = await this.prisma.user.findUnique({
      where: { phoneNumber: dto.phoneNumber },
    });

    if (!user || !user.isVerified) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValid = await this.otpService.verifyOtp(dto.phoneNumber, dto.otp);
    if (!isValid) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    // Register/update device and create session
    const device = await this.deviceService.registerDevice(user.id, deviceDto);
    const tokens = await this.tokenService.generateTokens(user.id, device.id);
    await this.sessionService.createSession(user.id, device.id, tokens.refreshToken);

    // Get profile
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

  async refreshTokens(dto: RefreshTokenDto) {
    const payload = await this.tokenService.verifyRefreshToken(dto.refreshToken);
    if (!payload) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const session = await this.sessionService.findSession(payload.sessionId);
    if (!session || session.revokedAt) {
      throw new UnauthorizedException('Session revoked');
    }

    // Rotate tokens
    const tokens = await this.tokenService.generateTokens(payload.sub, payload.deviceId);
    await this.sessionService.updateSession(session.id, tokens.refreshToken);

    return tokens;
  }

  async logout(userId: string, deviceId: string) {
    await this.sessionService.revokeSession(userId, deviceId);
    return { message: 'Logged out successfully' };
  }

  async logoutAllDevices(userId: string) {
    await this.sessionService.revokeAllSessions(userId);
    return { message: 'Logged out from all devices' };
  }

  async deleteAccount(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { deletedAt: new Date() },
    });
    await this.sessionService.revokeAllSessions(userId);
    return { message: 'Account scheduled for deletion' };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { password, ...safeUser } = user;
    return safeUser;
  }
}