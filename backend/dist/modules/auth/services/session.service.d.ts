import { PrismaService } from '@shared/database/prisma.service';
import { TokenService } from './token.service';
export declare class SessionService {
    private readonly prisma;
    private readonly tokenService;
    constructor(prisma: PrismaService, tokenService: TokenService);
    createSession(userId: string, deviceId: string, refreshToken: string): Promise<any>;
    findSession(sessionId: string): Promise<any>;
    updateSession(sessionId: string, newRefreshToken: string): Promise<any>;
    revokeSession(userId: string, deviceId: string): Promise<void>;
    revokeAllSessions(userId: string): Promise<void>;
    revokeSessionById(sessionId: string): Promise<void>;
    getUserSessions(userId: string): Promise<any>;
    cleanupExpiredSessions(): Promise<any>;
    private hashToken;
}
