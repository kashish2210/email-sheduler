import { RedisOptions } from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

export const redisConfig: RedisOptions | string = process.env.REDIS_URL || {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null,
};

// Helper to get RedisOptions for BullMQ (which doesn't accept string URLs directly in connection option)
export const getBullMQRedisConfig = (): RedisOptions => {
  if (typeof redisConfig === 'string') {
    // Parse Redis URL to extract host, port, password
    const url = new URL(redisConfig);
    return {
      host: url.hostname,
      port: parseInt(url.port) || 6379,
      password: url.password || undefined,
      maxRetriesPerRequest: null,
    };
  }
  return redisConfig;
};
