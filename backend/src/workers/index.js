// Bull queue processors. Run as a separate process: `npm run worker`.
import { connectMongo } from '../config/db.js';
import { getDisputeQueue } from '../queues/disputeQueue.js';
import { getWatchQueue, WEEKLY_CRON } from '../queues/watchQueue.js';
import { disputeService } from '../services/disputeService.js';
import { regulationService } from '../services/regulationService.js';
import { regulatoryWatchService } from '../services/regulatoryWatchService.js';
import { logger } from '../utils/logger.js';

const setupDisputes = (queue) => {
  queue.process('process-dispute', 2, async (job) => {
    const { disputeId, userId, checkId } = job.data;
    logger.info(`Processing dispute ${disputeId}`);
    await disputeService.process({ disputeId, userId, checkId });
    return { ok: true };
  });
  logger.info('Worker: listening on "dispute" queue');
};

// Weekly IRDAI watch — ensure a single repeatable job, then process it.
const setupWatch = async (queue) => {
  queue.process('irdai-watch', async () => {
    logger.info('IRDAI watch: running weekly check…');
    return regulatoryWatchService.runWeeklyCheck();
  });

  // Clear any stale repeatable definitions, then (re)schedule one.
  const existing = await queue.getRepeatableJobs().catch(() => []);
  await Promise.all(
    existing.filter((r) => r.name === 'irdai-watch').map((r) => queue.removeRepeatableByKey(r.key).catch(() => {}))
  );
  await queue.add('irdai-watch', {}, { repeat: { cron: WEEKLY_CRON } });
  logger.info(`Worker: IRDAI watch scheduled (cron "${WEEKLY_CRON}")`);
};

const main = async () => {
  await connectMongo();
  await regulationService.warm();

  const disputeQueue = getDisputeQueue();
  const watchQueue = getWatchQueue();

  if (!disputeQueue && !watchQueue) {
    logger.warn('No queues available (Redis down) — worker idle. Disputes run inline in the API.');
    return;
  }
  if (disputeQueue) setupDisputes(disputeQueue);
  if (watchQueue) await setupWatch(watchQueue);

  logger.info('Worker started.');
};

main().catch((err) => {
  logger.error('Worker fatal error', err);
  process.exit(1);
});
