import IORedis from 'ioredis';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

// Shared connection for caches / token blacklist. Bull creates its own.
let client = null;

export const getRedis = () => {
  if (client) return client;
  client = new IORedis(env.redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: false,
  });
  client.on('error', (err) => logger.warn(`Redis error: ${err.message}`));
  client.on('connect', () => logger.info('Redis connected'));
  return client;
}

export const redisConnectionOpts = { url: env.redisUrl };
