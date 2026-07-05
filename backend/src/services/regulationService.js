import { regulationRepository } from '../repositories/regulationRepository.js';
import { irdaiRegulations as STATIC_REGS } from '../data/irdaiRegulations.js';
import { logger } from '../utils/logger.js';

// DB-backed regulations with an in-memory cache so the agents/tools can do
// synchronous lookups during a pipeline run. Admin edits go through the CRUD
// methods, which refresh the cache. Falls back to the static seed list if the
// cache hasn't been warmed (e.g. a process that never connected to Mongo).
let cache = null;

const toPlain = (doc) => ({
  id: doc._id?.toString?.() || doc.id,
  code: doc.code,
  ref: doc.ref,
  title: doc.title,
  text: doc.text,
  appliesTo: doc.appliesTo || [],
  category: doc.category || 'rule',
  effective: doc.effective || '',
  source: doc.source || '',
  enabled: doc.enabled !== false,
});

const refresh = async () => {
  const docs = await regulationRepository.all();
  cache = docs.map(toPlain);
  return cache;
};

export const regulationService = {
  // Load the cache; seed the collection from the static list on first run.
  async warm() {
    try {
      const count = await regulationRepository.count();
      if (count === 0) {
        await regulationRepository.insertMany(STATIC_REGS.map((r) => ({ ...r, category: r.category || 'rule' })));
        logger.info(`Seeded ${STATIC_REGS.length} regulations`);
      }
      await refresh();
      logger.info(`Regulations cache warmed (${cache.length})`);
    } catch (err) {
      logger.warn(`regulation warm failed, using static fallback: ${err.message}`);
      cache = null;
    }
  },

  // ── Sync accessors for the engine/tools (cache, with static fallback) ──
  all() {
    return (cache && cache.length ? cache : STATIC_REGS).filter((r) => r.enabled !== false);
  },
  lookup(ruleType) {
    return regulationService.all().filter((r) => (r.appliesTo || []).includes(ruleType));
  },
  search(text) {
    const q = String(text || '').toLowerCase();
    return regulationService.all().filter((r) => `${r.title} ${r.text}`.toLowerCase().includes(q));
  },

  // ── Admin CRUD (refresh cache after each mutation) ──
  async list() {
    const docs = await regulationRepository.all();
    return docs.map(toPlain);
  },
  async create(data) {
    const doc = await regulationRepository.create(data);
    await refresh();
    return toPlain(doc);
  },
  async update(id, patch) {
    const doc = await regulationRepository.update(id, patch);
    await refresh();
    return doc ? toPlain(doc) : null;
  },
  async remove(id) {
    const doc = await regulationRepository.remove(id);
    await refresh();
    return Boolean(doc);
  },
};
