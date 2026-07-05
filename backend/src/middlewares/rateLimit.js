import { getRedis } from '../config/redis.js';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

// Per-IP sliding window, env-overridable. Defaults are generous because a SPA
// fires many calls per page (queries + polling). Backed by Redis; degrades to
// allow-all if Redis is down (availability over strictness in dev).
const WINDOWS = [
  { suffix: 'm', limit: Number(process.env.RATE_LIMIT_PER_MIN) || 120, ttl: 60 },
  { suffix: 'h', limit: Number(process.env.RATE_LIMIT_PER_HOUR) || 2000, ttl: 3600 },
];

export const rateLimit = async (req, res, next) => {
  // No rate limiting in development — React StrictMode double-fires requests and
  // the dev poll/query load trips it constantly. Only enforce in production.
  if (!env.isProd) return next();
  try {
    const redis = getRedis();
    const ip = req.ip || req.connection?.remoteAddress || 'unknown';
    for (const w of WINDOWS) {
      const key = `rl:${ip}:${w.suffix}`;
      // eslint-disable-next-line no-await-in-loop
      const count = await redis.incr(key);
      if (count === 1) {
        // eslint-disable-next-line no-await-in-loop
        await redis.expire(key, w.ttl);
      }
      if (count > w.limit) {
        return next(new AppError('Too many requests — please slow down', 429, 'RATE_LIMITED', { window: w.suffix, limit: w.limit }));
      }
    }
    return next();
  } catch {
    return next();
  }
}
