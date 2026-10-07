import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { Logger as PinoLogger } from 'pino';

interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
  path: string;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: PinoLogger) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const errorResponse = this.buildErrorResponse(exception, request.url);
    const statusCode = this.getStatusCode(exception);

    this.logError(exception, request, errorResponse, statusCode);

    response.status(statusCode).json(errorResponse);
  }

  private buildErrorResponse(exception: unknown, path: string): ErrorResponse {
    const timestamp = new Date().toISOString();

    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      return {
        success: false,
        error: {
          code: exception.constructor.name,
          message: typeof response === 'string' ? response : (response as any).message || exception.message,
          details: typeof response === 'object' ? (response as any).details : undefined,
        },
        timestamp,
        path,
      };
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      return this.handlePrismaError(exception, path, timestamp);
    }

    if (exception instanceof Prisma.PrismaClientValidationError) {
      return {
        success: false,
        error: {
          code: 'ValidationError',
          message: 'Invalid data provided',
          details: exception.message,
        },
        timestamp,
        path,
      };
    }

    if (exception instanceof Error) {
      return {
        success: false,
        error: {
          code: 'InternalServerError',
          message: process.env.NODE_ENV === 'production'
            ? 'An unexpected error occurred'
            : exception.message,
          details: process.env.NODE_ENV === 'production' ? undefined : exception.stack,
        },
        timestamp,
        path,
      };
    }

    return {
      success: false,
      error: {
        code: 'UnknownError',
        message: 'An unknown error occurred',
      },
      timestamp,
      path,
    };
  }

  private handlePrismaError(
    exception: Prisma.PrismaClientKnownRequestError,
    path: string,
    timestamp: string,
  ): ErrorResponse {
    switch (exception.code) {
      case 'P2002': {
        const target = (exception.meta?.target as string[])?.join(', ') || 'field';
        return {
          success: false,
          error: {
            code: 'UniqueConstraintViolation',
            message: `A record with this ${target} already exists`,
            details: { field: target },
          },
          timestamp,
          path,
        };
      }
      case 'P2025': {
        return {
          success: false,
          error: {
            code: 'NotFound',
            message: 'Record not found',
          },
          timestamp,
          path,
        };
      }
      case 'P2003': {
        return {
          success: false,
          error: {
            code: 'ForeignKeyConstraintViolation',
            message: 'Referenced record does not exist',
          },
          timestamp,
          path,
        };
      }
      default: {
        return {
          success: false,
          error: {
            code: 'DatabaseError',
            message: process.env.NODE_ENV === 'production'
              ? 'A database error occurred'
              : exception.message,
          },
          timestamp,
          path,
        };
      }
    }
  }

  private getStatusCode(exception: unknown): number {
    if (exception instanceof HttpException) {
      return exception.getStatus();
    }
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      switch (exception.code) {
        case 'P2002':
          return HttpStatus.CONFLICT;
        case 'P2025':
          return HttpStatus.NOT_FOUND;
        case 'P2003':
          return HttpStatus.BAD_REQUEST;
        default:
          return HttpStatus.INTERNAL_SERVER_ERROR;
      }
    }
    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  private logError(
    exception: unknown,
    request: Request,
    errorResponse: ErrorResponse,
    statusCode: number,
  ) {
    const logData = {
      method: request.method,
      url: request.url,
      ip: request.ip,
      userAgent: request.headers['user-agent'],
      userId: (request as any).user?.sub || 'anonymous',
      statusCode,
      error: errorResponse.error,
    };

    if (statusCode >= 500) {
      this.logger.error(logData, 'Server Error');
    } else if (statusCode >= 400) {
      this.logger.warn(logData, 'Client Error');
    } else {
      this.logger.info(logData, 'Request Error');
    }
  }
}