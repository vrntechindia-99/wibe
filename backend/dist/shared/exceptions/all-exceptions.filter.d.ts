import { ExceptionFilter, ArgumentsHost } from '@nestjs/common';
import { Logger as PinoLogger } from 'pino';
export declare class AllExceptionsFilter implements ExceptionFilter {
    private readonly logger;
    constructor(logger: PinoLogger);
    catch(exception: unknown, host: ArgumentsHost): void;
    private buildErrorResponse;
    private handlePrismaError;
    private getStatusCode;
    private logError;
}
