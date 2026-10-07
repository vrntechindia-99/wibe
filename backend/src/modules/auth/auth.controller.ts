import { Controller, Post, Get, Delete, Body, Req, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';

import { AuthService } from './auth.service';
import { JwtAuthGuard } from '@shared/guards/jwt-auth.guard';
import { RegisterDto } from './dto/register.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { DeviceDto } from './dto/device.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register with phone number' })
  @ApiResponse({ status: 201, description: 'OTP sent' })
  @ApiResponse({ status: 409, description: 'Phone number already registered' })
  async register(@Body() dto: RegisterDto, @Body() deviceDto: DeviceDto) {
    return this.authService.register(dto, deviceDto);
  }

  @Post('verify-otp')
  @ApiOperation({ summary: 'Verify OTP for registration' })
  @ApiResponse({ status: 200, description: 'Verified, returns tokens' })
  @ApiResponse({ status: 401, description: 'Invalid OTP' })
  async verifyOtp(@Body() dto: VerifyOtpDto, @Body() deviceDto: DeviceDto) {
    return this.authService.verifyOtp(dto, deviceDto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Request OTP for login' })
  @ApiResponse({ status: 200, description: 'OTP sent' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() dto: LoginDto, @Body() deviceDto: DeviceDto) {
    return this.authService.login(dto, deviceDto);
  }

  @Post('verify-login')
  @ApiOperation({ summary: 'Verify OTP for login' })
  @ApiResponse({ status: 200, description: 'Verified, returns tokens and user' })
  @ApiResponse({ status: 401, description: 'Invalid OTP' })
  async verifyLoginOtp(@Body() dto: VerifyOtpDto, @Body() deviceDto: DeviceDto) {
    return this.authService.verifyLoginOtp(dto, deviceDto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'New tokens' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshTokens(dto);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout from current device' })
  @ApiResponse({ status: 200, description: 'Logged out' })
  async logout(@Req() req: Request, @Body() deviceDto: DeviceDto) {
    const userId = req['user'].sub;
    return this.authService.logout(userId, deviceDto.deviceId);
  }

  @Post('logout-all')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout from all devices' })
  @ApiResponse({ status: 200, description: 'Logged out from all devices' })
  async logoutAll(@Req() req: Request) {
    const userId = req['user'].sub;
    return this.authService.logoutAllDevices(userId);
  }

  @Delete('account')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete account' })
  @ApiResponse({ status: 200, description: 'Account deleted' })
  async deleteAccount(@Req() req: Request) {
    const userId = req['user'].sub;
    return this.authService.deleteAccount(userId);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile' })
  async getProfile(@Req() req: Request) {
    const userId = req['user'].sub;
    return this.authService.getProfile(userId);
  }
}