import mongoose from 'mongoose';

const { Schema } = mongoose;

// Database-backed LLM response cache to avoid repeat costs.
const llmCacheSchema = new Schema(
  {
    cacheKey: { type: String, required: true, unique: true, index: true },
    provider: { type: String },
    model: { type: String },
    response: { type: String, required: true },
    expiresAt: { type: Date, index: { expires: 0 } },
  },
  { timestamps: true }
);

export const LlmCache = mongoose.model('LlmCache', llmCacheSchema, 'llm_cache');
