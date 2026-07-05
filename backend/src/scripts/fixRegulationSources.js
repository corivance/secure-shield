// One-off migration: repoint seeded provisions whose source is the generic
// health-dept landing page to the actual Master Circular PDF. Leaves synced
// circulars (which have their own PDF links) untouched.
//   node src/scripts/fixRegulationSources.js
import { connectMongo, disconnectMongo } from '../config/db.js';
import { Regulation } from '../models/Regulation.js';
import { logger } from '../utils/logger.js';

const MASTER_CIRCULAR_PDF =
  'https://irdai.gov.in/documents/37343/365525/Master+Circular++on+Health++Insurance+Business++29052024.pdf/5e707a91-b5de-1ec1-cf18-b66273a6839d?t=1716962621002&version=1.0';

const main = async () => {
  await connectMongo();
  const res = await Regulation.updateMany(
    { source: 'https://irdai.gov.in/health-dept' },
    { source: MASTER_CIRCULAR_PDF }
  );
  logger.info(`Repointed ${res.modifiedCount} provision source(s) to the Master Circular PDF.`);
  await disconnectMongo();
  process.exit(0);
};

main().catch((err) => {
  logger.error('fixRegulationSources failed', err);
  process.exit(1);
});
