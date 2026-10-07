import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
export interface TokenPayload {
    sub: string;
    deviceId: string;
    sessionId: string;
    type: 'access' | 'refresh';
}
export declare class TokenService {
    private readonly jwtService;
    private readonly configService;
    constructor(jwtService: JwtService, configService: ConfigService);
    generateTokens(userId: string, deviceId: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    generateAccessToken(userId: string, deviceId: string, sessionId: string): Promise<string>;
    generateRefreshToken(userId: string, deviceId: string, sessionId: string): Promise<string>;
    verifyAccessToken(token: string): Promise<TokenPayload | null>;
    verifyRefreshToken(token: string): Promise<TokenPayload | null>;
    decodeToken(token: string): TokenPayload | null;
}
