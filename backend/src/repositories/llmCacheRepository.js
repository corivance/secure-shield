import { LlmCache } from '../models/LlmCache.js';

export const llmCacheRepository = {
  get(cacheKey) {
    return LlmCache.findOne({ cacheKey }).exec();
  },

  put(cacheKey, { provider, model, response, ttlMs = 24 * 60 * 60 * 1000 }) {
    return LlmCache.findOneAndUpdate(
      { cacheKey },
      { provider, model, response, expiresAt: new Date(Date.now() + ttlMs) },
      { upsert: true, new: true }
    );
  },
};
