import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Logger } from 'pino';

@Injectable()
export class LoggingInterceptor {
  constructor(private readonly logger: Logger) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, ip, headers } = request;
    const userAgent = headers['user-agent'] || '';
    const userId = request.user?.sub || 'anonymous';

    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          this.logger.info({
            method,
            url,
            ip,
            userAgent,
            userId,
            duration: `${duration}ms`,
            statusCode: context.switchToHttp().getResponse().statusCode,
          }, 'HTTP Request');
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          this.logger.error({
            method,
            url,
            ip,
            userAgent,
            userId,
            duration: `${duration}ms`,
            error: error.message,
            stack: error.stack,
          }, 'HTTP Request Error');
        },
      }),
    );
  }
}