import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client = context.switchToWs().getClient();
    const token = this.extractTokenFromHandshake(client);

    if (!token) {
      throw new UnauthorizedException('Authentication token required');
    }

    try {
      const secret = this.configService.get<string>('JWT_ACCESS_SECRET');
      const payload = await this.jwtService.verifyAsync(token, { secret });
      client['user'] = payload;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    return true;
  }

  private extractTokenFromHandshake(client: any): string | undefined {
    // Try to get token from handshake auth
    const auth = client.handshake?.auth;
    if (auth?.token) {
      return auth.token;
    }

    // Try to get token from query params
    const query = client.handshake?.query;
    if (query?.token) {
      return query.token;
    }

    // Try to get token from headers
    const headers = client.handshake?.headers;
    if (headers?.authorization) {
      const [type, token] = headers.authorization.split(' ');
      if (type === 'Bearer') {
        return token;
      }
    }

    return undefined;
  }
}