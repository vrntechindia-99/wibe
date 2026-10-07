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
var RedisService_1;
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const ioredis_1 = require("ioredis");
let RedisService = RedisService_1 = class RedisService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(RedisService_1.name);
        const redisUrl = this.configService.get('REDIS_URL') || 'redis://localhost:6379';
        this.client = new ioredis_1.default(redisUrl, {
            maxRetriesPerRequest: 3,
            retryDelayOnFailover: 100,
            enableReadyCheck: true,
            lazyConnect: true,
        });
        this.subscriber = new ioredis_1.default(redisUrl, {
            maxRetriesPerRequest: 3,
            retryDelayOnFailover: 100,
            enableReadyCheck: true,
            lazyConnect: true,
        });
        this.publisher = new ioredis_1.default(redisUrl, {
            maxRetriesPerRequest: 3,
            retryDelayOnFailover: 100,
            enableReadyCheck: true,
            lazyConnect: true,
        });
        this.setupEventHandlers();
    }
    setupEventHandlers() {
        [this.client, this.subscriber, this.publisher].forEach((instance, index) => {
            const name = ['client', 'subscriber', 'publisher'][index];
            instance.on('connect', () => {
                this.logger.log(`Redis ${name} connected`);
            });
            instance.on('ready', () => {
                this.logger.log(`Redis ${name} ready`);
            });
            instance.on('error', (err) => {
                this.logger.error(`Redis ${name} error`, err);
            });
            instance.on('close', () => {
                this.logger.warn(`Redis ${name} connection closed`);
            });
            instance.on('reconnecting', () => {
                this.logger.log(`Redis ${name} reconnecting...`);
            });
        });
    }
    async onModuleInit() {
        await Promise.all([
            this.client.connect(),
            this.subscriber.connect(),
            this.publisher.connect(),
        ]);
        this.logger.log('All Redis connections established');
    }
    async onModuleDestroy() {
        await Promise.all([
            this.client.quit(),
            this.subscriber.quit(),
            this.publisher.quit(),
        ]);
        this.logger.log('All Redis connections closed');
    }
    async set(key, value, ttlSeconds) {
        if (ttlSeconds) {
            await this.client.setex(key, ttlSeconds, value);
        }
        else {
            await this.client.set(key, value);
        }
    }
    async get(key) {
        return this.client.get(key);
    }
    async del(key) {
        await this.client.del(key);
    }
    async exists(key) {
        const result = await this.client.exists(key);
        return result === 1;
    }
    async expire(key, ttlSeconds) {
        await this.client.expire(key, ttlSeconds);
    }
    async hset(key, field, value) {
        await this.client.hset(key, field, value);
    }
    async hget(key, field) {
        return this.client.hget(key, field);
    }
    async hgetall(key) {
        return this.client.hgetall(key);
    }
    async hdel(key, field) {
        await this.client.hdel(key, field);
    }
    async sadd(key, ...members) {
        await this.client.sadd(key, ...members);
    }
    async srem(key, ...members) {
        await this.client.srem(key, ...members);
    }
    async smembers(key) {
        return this.client.smembers(key);
    }
    async sismember(key, member) {
        const result = await this.client.sismember(key, member);
        return result === 1;
    }
    async publish(channel, message) {
        await this.publisher.publish(channel, message);
    }
    async subscribe(channel, callback) {
        await this.subscriber.subscribe(channel);
        this.subscriber.on('message', (ch, msg) => {
            if (ch === channel) {
                callback(msg);
            }
        });
    }
    async unsubscribe(channel) {
        await this.subscriber.unsubscribe(channel);
    }
    async setUserOnline(userId, deviceId, ttlSeconds = 300) {
        const key = `presence:${userId}`;
        await this.client.hset(key, deviceId, Date.now().toString());
        await this.client.expire(key, ttlSeconds);
        await this.client.sadd('online_users', userId);
    }
    async setUserOffline(userId, deviceId) {
        const key = `presence:${userId}`;
        if (deviceId) {
            await this.client.hdel(key, deviceId);
            const remaining = await this.client.hlen(key);
            if (remaining === 0) {
                await this.client.del(key);
                await this.client.srem('online_users', userId);
            }
        }
        else {
            await this.client.del(key);
            await this.client.srem('online_users', userId);
        }
    }
    async isUserOnline(userId) {
        return this.client.sismember('online_users', userId);
    }
    async getUserDevices(userId) {
        return this.client.hgetall(`presence:${userId}`);
    }
    async setTyping(userId, conversationId, ttlSeconds = 10) {
        const key = `typing:${conversationId}`;
        await this.client.hset(key, userId, Date.now().toString());
        await this.client.expire(key, ttlSeconds);
    }
    async removeTyping(userId, conversationId) {
        const key = `typing:${conversationId}`;
        await this.client.hdel(key, userId);
    }
    async getTypingUsers(conversationId) {
        const key = `typing:${conversationId}`;
        return Object.keys(await this.client.hgetall(key));
    }
    async incrementRateLimit(key, windowSeconds) {
        const current = await this.client.incr(key);
        if (current === 1) {
            await this.client.expire(key, windowSeconds);
        }
        return current;
    }
    async enqueueOfflineMessage(userId, message) {
        await this.client.lpush(`offline_queue:${userId}`, message);
    }
    async dequeueOfflineMessages(userId, count) {
        const messages = [];
        for (let i = 0; i < count; i++) {
            const msg = await this.client.rpop(`offline_queue:${userId}`);
            if (!msg)
                break;
            messages.push(msg);
        }
        return messages;
    }
    async getOfflineQueueLength(userId) {
        return this.client.llen(`offline_queue:${userId}`);
    }
};
exports.RedisService = RedisService;
exports.RedisService = RedisService = RedisService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _a : Object])
], RedisService);
//# sourceMappingURL=redis.service.js.map