import Bull from 'bull';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

let queue = null;
let attempted = false;

// Lazily create the dispute queue. Returns null if Redis/Bull is unavailable so
// callers can fall back to inline processing.
export const getDisputeQueue = () => {
  if (attempted) return queue;
  attempted = true;
  try {
    queue = new Bull('dispute', env.redisUrl, {
      defaultJobOptions: { attempts: 2, backoff: 5000, removeOnComplete: 100, removeOnFail: 50 },
    });
    queue.on('error', (err) => logger.warn(`dispute queue error: ${err.message}`));
  } catch (err) {
    logger.warn(`Bull unavailable, disputes run inline: ${err.message}`);
    queue = null;
  }
  return queue;
}
