// One-off maintenance: delete users by email.
//   node src/scripts/removeUsers.js a@x.com b@y.com
import { connectMongo, disconnectMongo } from '../config/db.js';
import { User } from '../models/User.js';
import { logger } from '../utils/logger.js';

const main = async () => {
  const emails = process.argv.slice(2).map((e) => e.toLowerCase());
  if (!emails.length) {
    logger.warn('No emails passed. Usage: node src/scripts/removeUsers.js <email> [email...]');
    process.exit(1);
  }
  await connectMongo();
  const res = await User.deleteMany({ email: { $in: emails } });
  logger.info(`Deleted ${res.deletedCount} user(s): ${emails.join(', ')}`);
  await disconnectMongo();
  process.exit(0);
};

main().catch((err) => {
  logger.error('removeUsers failed', err);
  process.exit(1);
});
