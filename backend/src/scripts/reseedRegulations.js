// Wipe and re-seed the regulations collection from data/irdaiRegulations.js.
// Regulations are reference data (no user content), so a clean re-seed is safe.
//   node src/scripts/reseedRegulations.js
import { connectMongo, disconnectMongo } from '../config/db.js';
import { regulationRepository } from '../repositories/regulationRepository.js';
import { irdaiRegulations } from '../data/irdaiRegulations.js';
import { logger } from '../utils/logger.js';

const main = async () => {
  await connectMongo();
  const removed = await regulationRepository.deleteAll();
  const docs = await regulationRepository.insertMany(
    irdaiRegulations.map((r) => ({ ...r, category: r.category || 'rule' }))
  );
  logger.info(`Re-seeded regulations: removed ${removed.deletedCount}, inserted ${docs.length}`);
  await disconnectMongo();
  process.exit(0);
};

main().catch((err) => {
  logger.error('reseedRegulations failed', err);
  process.exit(1);
});
