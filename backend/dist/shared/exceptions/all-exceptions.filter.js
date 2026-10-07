"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AllExceptionsFilter = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
let AllExceptionsFilter = class AllExceptionsFilter {
    constructor(logger) {
        this.logger = logger;
    }
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        const errorResponse = this.buildErrorResponse(exception, request.url);
        const statusCode = this.getStatusCode(exception);
        this.logError(exception, request, errorResponse, statusCode);
        response.status(statusCode).json(errorResponse);
    }
    buildErrorResponse(exception, path) {
        const timestamp = new Date().toISOString();
        if (exception instanceof common_1.HttpException) {
            const response = exception.getResponse();
            return {
                success: false,
                error: {
                    code: exception.constructor.name,
                    message: typeof response === 'string' ? response : response.message || exception.message,
                    details: typeof response === 'object' ? response.details : undefined,
                },
                timestamp,
                path,
            };
        }
        if (exception instanceof client_1.Prisma.PrismaClientKnownRequestError) {
            return this.handlePrismaError(exception, path, timestamp);
        }
        if (exception instanceof client_1.Prisma.PrismaClientValidationError) {
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
    handlePrismaError(exception, path, timestamp) {
        switch (exception.code) {
            case 'P2002': {
                const target = exception.meta?.target?.join(', ') || 'field';
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
    getStatusCode(exception) {
        if (exception instanceof common_1.HttpException) {
            return exception.getStatus();
        }
        if (exception instanceof client_1.Prisma.PrismaClientKnownRequestError) {
            switch (exception.code) {
                case 'P2002':
                    return common_1.HttpStatus.CONFLICT;
                case 'P2025':
                    return common_1.HttpStatus.NOT_FOUND;
                case 'P2003':
                    return common_1.HttpStatus.BAD_REQUEST;
                default:
                    return common_1.HttpStatus.INTERNAL_SERVER_ERROR;
            }
        }
        return common_1.HttpStatus.INTERNAL_SERVER_ERROR;
    }
    logError(exception, request, errorResponse, statusCode) {
        const logData = {
            method: request.method,
            url: request.url,
            ip: request.ip,
            userAgent: request.headers['user-agent'],
            userId: request.user?.sub || 'anonymous',
            statusCode,
            error: errorResponse.error,
        };
        if (statusCode >= 500) {
            this.logger.error(logData, 'Server Error');
        }
        else if (statusCode >= 400) {
            this.logger.warn(logData, 'Client Error');
        }
        else {
            this.logger.info(logData, 'Request Error');
        }
    }
};
exports.AllExceptionsFilter = AllExceptionsFilter;
exports.AllExceptionsFilter = AllExceptionsFilter = __decorate([
    (0, common_1.Catch)(),
    __metadata("design:paramtypes", [Object])
], AllExceptionsFilter);
//# sourceMappingURL=all-exceptions.filter.js.map