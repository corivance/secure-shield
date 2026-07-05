import Bull from 'bull';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

// Weekly IRDAI watch. Default: every Monday 09:00 (server time). Override with
// IRDAI_WATCH_CRON. The job only runs while the worker + Redis are up.
export const WEEKLY_CRON = process.env.IRDAI_WATCH_CRON || '0 9 * * 1';

let queue = null;
let attempted = false;

export const getWatchQueue = () => {
  if (attempted) return queue;
  attempted = true;
  try {
    queue = new Bull('watch', env.redisUrl, {
      defaultJobOptions: { attempts: 1, removeOnComplete: 20, removeOnFail: 20 },
    });
    queue.on('error', (err) => logger.warn(`watch queue error: ${err.message}`));
  } catch (err) {
    logger.warn(`Bull unavailable, IRDAI watch disabled: ${err.message}`);
    queue = null;
  }
  return queue;
};
