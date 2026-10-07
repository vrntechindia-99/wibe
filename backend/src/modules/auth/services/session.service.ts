import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shared/database/prisma.service';
import { TokenService, TokenPayload } from './token.service';

@Injectable()
export class SessionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService,
  ) {}

  async createSession(userId: string, deviceId: string, refreshToken: string) {
    const payload = await this.tokenService.verifyRefreshToken(refreshToken);
    if (!payload) {
      throw new Error('Invalid refresh token');
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

    return this.prisma.session.create({
      data: {
        userId,
        deviceId,
        refreshToken: await this.hashToken(refreshToken),
        sessionId: payload.sessionId,
        expiresAt,
      },
    });
  }

  async findSession(sessionId: string) {
    return this.prisma.session.findUnique({
      where: { sessionId },
      include: { user: true, device: true },
    });
  }

  async updateSession(sessionId: string, newRefreshToken: string) {
    const payload = await this.tokenService.verifyRefreshToken(newRefreshToken);
    if (!payload) {
      throw new Error('Invalid refresh token');
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    return this.prisma.session.update({
      where: { sessionId },
      data: {
        refreshToken: await this.hashToken(newRefreshToken),
        expiresAt,
      },
    });
  }

  async revokeSession(userId: string, deviceId: string) {
    await this.prisma.session.updateMany({
      where: { userId, deviceId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllSessions(userId: string) {
    await this.prisma.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async revokeSessionById(sessionId: string) {
    await this.prisma.session.update({
      where: { sessionId },
      data: { revokedAt: new Date() },
    });
  }

  async getUserSessions(userId: string) {
    return this.prisma.session.findMany({
      where: { userId, revokedAt: null },
      include: { device: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async cleanupExpiredSessions() {
    const result = await this.prisma.session.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    return result.count;
  }

  private async hashToken(token: string): Promise<string> {
    // In production, use bcrypt or similar
    // For now, store as-is but in practice should hash
    return token;
  }
}