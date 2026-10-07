"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const swagger_1 = require("@nestjs/swagger");
const helmet_1 = require("helmet");
const compression = require("compression");
const pino_1 = require("pino");
const app_module_1 = require("./app.module");
const all_exceptions_filter_1 = require("./shared/exceptions/all-exceptions.filter");
const transform_interceptor_1 = require("./shared/interceptors/transform.interceptor");
const logging_interceptor_1 = require("./shared/interceptors/logging.interceptor");
async function bootstrap() {
    const logger = (0, pino_1.default)({ level: process.env.LOG_LEVEL || 'info' });
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        bufferLogs: true,
        logger: ['log', 'error', 'warn', 'debug', 'verbose'],
    });
    const configService = app.get(config_1.ConfigService);
    const port = configService.get('PORT') || 3000;
    const apiPrefix = configService.get('API_PREFIX') || 'api/v1';
    const nodeEnv = configService.get('NODE_ENV') || 'development';
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
            enableImplicitConversion: true,
        },
        disableErrorMessages: nodeEnv === 'production',
    }));
    app.useGlobalInterceptors(new logging_interceptor_1.LoggingInterceptor(logger), new transform_interceptor_1.TransformInterceptor());
    app.useGlobalFilters(new all_exceptions_filter_1.AllExceptionsFilter(logger));
    app.use((0, helmet_1.default)());
    app.use(compression());
    app.enableCors({
        origin: configService.get('WS_CORS_ORIGIN') || '*',
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    });
    app.enableVersioning({
        type: common_1.VersioningType.URI,
        defaultVersion: '1',
    });
    app.setGlobalPrefix(apiPrefix);
    if (nodeEnv !== 'production') {
        const config = new swagger_1.DocumentBuilder()
            .setTitle('Wibe API')
            .setDescription('Real-time Communication Platform API')
            .setVersion('1.0')
            .addBearerAuth()
            .addTag('auth', 'Authentication endpoints')
            .addTag('users', 'User management')
            .addTag('conversations', 'Conversation management')
            .addTag('messages', 'Messaging')
            .addTag('groups', 'Group management')
            .addTag('media', 'Media upload/download')
            .addTag('calls', 'Voice/Video calls')
            .addTag('status', 'Status/Stories')
            .addTag('notifications', 'Push notifications')
            .build();
        const document = swagger_1.SwaggerModule.createDocument(app, config);
        swagger_1.SwaggerModule.setup('docs', app, document, {
            swaggerOptions: {
                persistAuthorization: true,
            },
        });
    }
    await app.listen(port);
    logger.info(`🚀 Wibe Backend running on http://localhost:${port}/${apiPrefix}`);
    logger.info(`📚 API Documentation: http://localhost:${port}/docs`);
}
bootstrap();
//# sourceMappingURL=main.js.map