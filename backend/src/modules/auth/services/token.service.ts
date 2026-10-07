import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';

export interface TokenPayload {
  sub: string;
  deviceId: string;
  sessionId: string;
  type: 'access' | 'refresh';
}

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async generateTokens(userId: string, deviceId: string) {
    const sessionId = uuidv4();

    const accessToken = await this.generateAccessToken(userId, deviceId, sessionId);
    const refreshToken = await this.generateRefreshToken(userId, deviceId, sessionId);

    return { accessToken, refreshToken };
  }

  async generateAccessToken(userId: string, deviceId: string, sessionId: string): Promise<string> {
    const payload: TokenPayload = {
      sub: userId,
      deviceId,
      sessionId,
      type: 'access',
    };

    return this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRY') || '15m',
    });
  }

  async generateRefreshToken(userId: string, deviceId: string, sessionId: string): Promise<string> {
    const payload: TokenPayload = {
      sub: userId,
      deviceId,
      sessionId,
      type: 'refresh',
    };

    return this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRY') || '30d',
    });
  }

  async verifyAccessToken(token: string): Promise<TokenPayload | null> {
    try {
      return await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      });
    } catch {
      return null;
    }
  }

  async verifyRefreshToken(token: string): Promise<TokenPayload | null> {
    try {
      return await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      return null;
    }
  }

  decodeToken(token: string): TokenPayload | null {
    try {
      return this.jwtService.decode(token) as TokenPayload;
    } catch {
      return null;
    }
  }
}