import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import { env } from './config/env.js';
import { connectMongo } from './config/db.js';
import { getRedis } from './config/redis.js';
import { logger } from './utils/logger.js';
import { router as apiRouter } from './routes/index.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { notFound } from './middlewares/notFound.js';
import { rateLimit } from './middlewares/rateLimit.js';
import { regulationService } from './services/regulationService.js';

export const createApp = () => {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Per-IP sliding-window rate limiting (30/min, 200/hr).
  app.use('/api', rateLimit);

  app.use('/api', apiRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

const bootstrap = async () => {
  await connectMongo();
  getRedis();
  await regulationService.warm();

  const app = createApp();
  app.listen(env.port, () => {
    logger.info(`SecureShield API listening on :${env.port} (${env.nodeEnv})`);
  });
}

// Only auto-start when run directly (not when imported by tests).
if (process.argv[1] && process.argv[1].endsWith('app.js')) {
  bootstrap().catch((err) => {
    logger.error('Fatal boot error', err);
    process.exit(1);
  });
}
