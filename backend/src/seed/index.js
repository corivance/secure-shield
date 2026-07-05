// Idempotent seed: super admin, AI key config slots, and the precedent corpus.
import { connectMongo, disconnectMongo } from '../config/db.js';
import { userRepository } from '../repositories/userRepository.js';
import { aiKeyRepository } from '../repositories/aiKeyRepository.js';
import { precedentRepository } from '../repositories/precedentRepository.js';
import { regulationRepository } from '../repositories/regulationRepository.js';
import { planRepository } from '../repositories/planRepository.js';
import { precedents } from '../data/precedents.js';
import { irdaiRegulations } from '../data/irdaiRegulations.js';
import { embed } from '../utils/embeddings.js';
import { encrypt } from '../utils/crypto.js';
import { logger } from '../utils/logger.js';

const KEY_SLOTS = ['CEREBRAS_API_KEY', 'GROQ_API_KEY', 'OPENROUTER_API_KEY', 'GOOGLE_VISION_API_KEY', 'GEMINI_API_KEY'];

const seedSuperAdmin = async () => {
  const email = 'admin@secureshield.in';
  const existing = await userRepository.findByEmail(email);
  if (existing) {
    logger.info('Super admin already exists — skipping');
    return;
  }
  await userRepository.create({ fullName: 'SecureShield Admin', email, passwordHash: 'ChangeMe123!', roleSlug: 'super-admin', plan: 'enterprise' });
  logger.info(`Seeded super admin: ${email} / ChangeMe123!`);
}

const seedKeySlots = async () => {
  for (const keyName of KEY_SLOTS) {
    // Upsert disabled, empty slots so admins can later paste real keys.
    // eslint-disable-next-line no-await-in-loop
    const existing = await aiKeyRepository.findByName(keyName);
    if (existing) continue;
    // eslint-disable-next-line no-await-in-loop
    await aiKeyRepository.upsert(keyName, {
      keyName,
      provider: keyName.split('_')[0].toLowerCase(),
      encryptedValue: encrypt(''),
      enabled: false,
      notes: 'Paste a real key and set enabled:true to activate.',
    });
  }
  logger.info(`Ensured ${KEY_SLOTS.length} AI key slots`);
}

const seedPrecedents = async () => {
  const count = await precedentRepository.count();
  if (count > 0) {
    logger.info(`Precedents already seeded (${count}) — skipping`);
    return;
  }
  const docs = precedents.map((p) => ({ ...p, embedding: embed(`${p.summary} ${p.holding} ${p.tags.join(' ')}`) }));
  await precedentRepository.insertMany(docs);
  logger.info(`Seeded ${docs.length} precedents`);
}

const seedRegulations = async () => {
  const count = await regulationRepository.count();
  if (count > 0) {
    logger.info(`Regulations already seeded (${count}) — skipping`);
    return;
  }
  await regulationRepository.insertMany(irdaiRegulations.map((r) => ({ ...r, category: r.category || 'rule' })));
  logger.info(`Seeded ${irdaiRegulations.length} regulations`);
};

const seedPlans = async () => {
  const count = await planRepository.count();
  if (count > 0) {
    logger.info(`Plans already seeded (${count}) — skipping`);
    return;
  }
  await planRepository.insertMany([
    { slug: 'free', name: 'Free', description: 'Get started — core claim checking.', price: 0, isDefault: true, order: 0, limits: { policies: 2, eligibilityChecks: 10, disputes: 2 } },
    { slug: 'pro', name: 'Pro', description: 'For regular use — more policies, checks and disputes.', price: 499, order: 1, limits: { policies: 15, eligibilityChecks: 200, disputes: 25 } },
    { slug: 'enterprise', name: 'Enterprise', description: 'Unlimited everything.', price: 4999, order: 2, limits: { policies: -1, eligibilityChecks: -1, disputes: -1 } },
  ]);
  logger.info('Seeded 3 plans (free/pro/enterprise)');
};

const main = async () => {
  await connectMongo();
  await seedSuperAdmin();
  await seedKeySlots();
  await seedPrecedents();
  await seedRegulations();
  await seedPlans();
  await disconnectMongo();
  logger.info('Seed complete');
  process.exit(0);
}

main().catch((err) => {
  logger.error('Seed failed', err);
  process.exit(1);
});
