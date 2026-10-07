import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  public readonly client: Redis;
  public readonly subscriber: Redis;
  public readonly publisher: Redis;

  constructor(private readonly configService: ConfigService) {
    const redisUrl = this.configService.get<string>('REDIS_URL') || 'redis://localhost:6379';

    this.client = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryDelayOnFailover: 100,
      enableReadyCheck: true,
      lazyConnect: true,
    });

    this.subscriber = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryDelayOnFailover: 100,
      enableReadyCheck: true,
      lazyConnect: true,
    });

    this.publisher = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryDelayOnFailover: 100,
      enableReadyCheck: true,
      lazyConnect: true,
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
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

  // Key-value operations
  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.client.setex(key, ttlSeconds, value);
    } else {
      await this.client.set(key, value);
    }
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(key);
    return result === 1;
  }

  async expire(key: string, ttlSeconds: number): Promise<void> {
    await this.client.expire(key, ttlSeconds);
  }

  // Hash operations
  async hset(key: string, field: string, value: string): Promise<void> {
    await this.client.hset(key, field, value);
  }

  async hget(key: string, field: string): Promise<string | null> {
    return this.client.hget(key, field);
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    return this.client.hgetall(key);
  }

  async hdel(key: string, field: string): Promise<void> {
    await this.client.hdel(key, field);
  }

  // Set operations
  async sadd(key: string, ...members: string[]): Promise<void> {
    await this.client.sadd(key, ...members);
  }

  async srem(key: string, ...members: string[]): Promise<void> {
    await this.client.srem(key, ...members);
  }

  async smembers(key: string): Promise<string[]> {
    return this.client.smembers(key);
  }

  async sismember(key: string, member: string): Promise<boolean> {
    const result = await this.client.sismember(key, member);
    return result === 1;
  }

  // Pub/Sub
  async publish(channel: string, message: string): Promise<void> {
    await this.publisher.publish(channel, message);
  }

  async subscribe(channel: string, callback: (message: string) => void): Promise<void> {
    await this.subscriber.subscribe(channel);
    this.subscriber.on('message', (ch, msg) => {
      if (ch === channel) {
        callback(msg);
      }
    });
  }

  async unsubscribe(channel: string): Promise<void> {
    await this.subscriber.unsubscribe(channel);
  }

  // Presence helpers
  async setUserOnline(userId: string, deviceId: string, ttlSeconds = 300): Promise<void> {
    const key = `presence:${userId}`;
    await this.client.hset(key, deviceId, Date.now().toString());
    await this.client.expire(key, ttlSeconds);
    await this.client.sadd('online_users', userId);
  }

  async setUserOffline(userId: string, deviceId?: string): Promise<void> {
    const key = `presence:${userId}`;
    if (deviceId) {
      await this.client.hdel(key, deviceId);
      const remaining = await this.client.hlen(key);
      if (remaining === 0) {
        await this.client.del(key);
        await this.client.srem('online_users', userId);
      }
    } else {
      await this.client.del(key);
      await this.client.srem('online_users', userId);
    }
  }

  async isUserOnline(userId: string): Promise<boolean> {
    return this.client.sismember('online_users', userId);
  }

  async getUserDevices(userId: string): Promise<Record<string, string>> {
    return this.client.hgetall(`presence:${userId}`);
  }

  // Typing indicators
  async setTyping(userId: string, conversationId: string, ttlSeconds = 10): Promise<void> {
    const key = `typing:${conversationId}`;
    await this.client.hset(key, userId, Date.now().toString());
    await this.client.expire(key, ttlSeconds);
  }

  async removeTyping(userId: string, conversationId: string): Promise<void> {
    const key = `typing:${conversationId}`;
    await this.client.hdel(key, userId);
  }

  async getTypingUsers(conversationId: string): Promise<string[]> {
    const key = `typing:${conversationId}`;
    return Object.keys(await this.client.hgetall(key));
  }

  // Rate limiting helpers
  async incrementRateLimit(key: string, windowSeconds: number): Promise<number> {
    const current = await this.client.incr(key);
    if (current === 1) {
      await this.client.expire(key, windowSeconds);
    }
    return current;
  }

  // Offline message queue
  async enqueueOfflineMessage(userId: string, message: string): Promise<void> {
    await this.client.lpush(`offline_queue:${userId}`, message);
  }

  async dequeueOfflineMessages(userId: string, count: number): Promise<string[]> {
    const messages: string[] = [];
    for (let i = 0; i < count; i++) {
      const msg = await this.client.rpop(`offline_queue:${userId}`);
      if (!msg) break;
      messages.push(msg);
    }
    return messages;
  }

  async getOfflineQueueLength(userId: string): Promise<number> {
    return this.client.llen(`offline_queue:${userId}`);
  }
}