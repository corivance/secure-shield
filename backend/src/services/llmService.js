import crypto from 'node:crypto';
import axios from 'axios';
import { resolveKey, resolveKeyForUser } from './keyService.js';
import { llmCacheRepository } from '../repositories/llmCacheRepository.js';
import { logger } from '../utils/logger.js';

// Multi-model failover chain. Each provider degrades to the next on
// rate-limit/error so the app never goes down on free-tier limits. Keys come
// from ai_key_configs (resolveKey), never from .env.
// Model ids can be overridden per provider via env (e.g. CEREBRAS_MODEL) if your
// account's available models differ — no code change needed.
const PROVIDERS = [
  { id: 'cerebras', keyName: 'CEREBRAS_API_KEY', model: process.env.CEREBRAS_MODEL || 'llama-3.3-70b', url: 'https://api.cerebras.ai/v1/chat/completions' },
  { id: 'groq', keyName: 'GROQ_API_KEY', model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile', url: 'https://api.groq.com/openai/v1/chat/completions' },
  { id: 'openrouter', keyName: 'OPENROUTER_API_KEY', model: process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.1-8b-instruct', url: 'https://openrouter.ai/api/v1/chat/completions' },
];

const cacheKey = (prompt, system) => {
  return crypto.createHash('sha256').update(`${system}::${prompt}`).digest('hex');
}

// Per-provider cache of a model id known to work (avoids re-discovering).
const workingModel = {};

const isModelError = (msg) => /does not exist|not found|model_not_found|access to it|invalid model|decommission|unsupported/i.test(String(msg || ''));

// Discover the provider's available chat models via the OpenAI-compatible
// /v1/models endpoint, and pick a sensible one.
const discoverModel = async (provider, key) => {
  const base = provider.url.replace(/\/chat\/completions$/, '');
  const { data } = await axios.get(`${base}/models`, {
    headers: { Authorization: `Bearer ${key}` },
    timeout: 15000,
  });
  const ids = (data?.data || []).map((m) => m.id).filter(Boolean);
  const chat = ids.filter((id) => !/embed|whisper|tts|guard|vision|rerank|moderation/i.test(id));
  const llama = chat.find((id) => /llama.*(70b|8b)/i.test(id)) || chat.find((id) => /llama/i.test(id));
  return llama || chat[0] || ids[0] || null;
};

const callOpenAICompatible = async (provider, key, model, { system, prompt, temperature, maxTokens }) => {
  const { data } = await axios.post(
    provider.url,
    {
      model,
      temperature: temperature ?? 0.2,
      ...(maxTokens ? { max_tokens: maxTokens } : {}),
      messages: [
        ...(system ? [{ role: 'system', content: system }] : []),
        { role: 'user', content: prompt },
      ],
    },
    { headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }, timeout: 45000 }
  );
  return data?.choices?.[0]?.message?.content?.trim() || '';
}

// Call a provider, self-healing the model id: if the configured model is
// rejected, discover an available one and retry (then cache it). Returns
// { text, model }.
const callProvider = async (provider, key, opts) => {
  let model = workingModel[provider.id] || provider.model;
  try {
    return { text: await callOpenAICompatible(provider, key, model, opts), model };
  } catch (err) {
    const msg = err.response?.data?.error?.message || err.response?.data?.message || err.message;
    if (!isModelError(msg)) throw err;
    const discovered = await discoverModel(provider, key);
    if (!discovered) throw err;
    model = discovered;
    const text = await callOpenAICompatible(provider, key, model, opts);
    workingModel[provider.id] = model; // remember for next time
    logger.info(`LLM ${provider.id}: auto-selected model "${model}"`);
    return { text, model };
  }
}

// Returns { text, provider, model, cached, degraded }.
// Pass `userId` to use that user's own key first (then the shared admin key if
// granted). Without it, falls back to the shared admin key.
export const complete = async ({ prompt, system = '', temperature, maxTokens, useCache = true, userId }) => {
  const ck = cacheKey(prompt, system);

  if (useCache) {
    const hit = await llmCacheRepository.get(ck).catch(() => null);
    if (hit) return { text: hit.response, provider: hit.provider, model: hit.model, cached: true, degraded: false };
  }

  let triedAny = false;
  let lastError = null;
  for (const provider of PROVIDERS) {
    // Keys live AES-encrypted in ai_key_configs / user_api_keys, never in env.
    const key = userId ? await resolveKeyForUser(userId, provider.keyName) : await resolveKey(provider.keyName);
    if (!key) continue;
    triedAny = true;
    try {
      const { text, model } = await callProvider(provider, key, { system, prompt, temperature, maxTokens });
      if (text) {
        if (useCache) {
          await llmCacheRepository.put(ck, { provider: provider.id, model, response: text }).catch(() => {});
        }
        return { text, provider: provider.id, model, cached: false, degraded: false };
      }
    } catch (err) {
      lastError = `${provider.id}: ${err.response?.data?.error?.message || err.response?.data?.message || err.message}`;
      logger.warn(`LLM provider ${provider.id} failed: ${err.message} — failing over`);
    }
  }

  // No key/provider available — deterministic degraded response so the pipeline
  // never breaks. `reason` tells callers WHY: no key vs a provider error.
  return {
    text: '',
    provider: 'none',
    model: 'none',
    cached: false,
    degraded: true,
    reason: triedAny ? 'provider-error' : 'no-key',
    error: lastError,
  };
}

// Try ALL configured providers in parallel and return every successful result.
// The caller picks the best one (e.g. most rules extracted).
// Returns { results: [{ text, provider, model }], triedAny, lastError }
export const completeBest = async ({ prompt, system = '', temperature, maxTokens, userId }) => {
  const calls = [];
  for (const provider of PROVIDERS) {
    // eslint-disable-next-line no-await-in-loop
    const key = userId ? await resolveKeyForUser(userId, provider.keyName) : await resolveKey(provider.keyName);
    if (!key) continue;
    calls.push(
      callProvider(provider, key, { system, prompt, temperature, maxTokens })
        .then(({ text, model }) => (text ? { text, provider: provider.id, model } : null))
        .catch((err) => {
          logger.warn(`LLM provider ${provider.id} failed (best-of): ${err.message}`);
          return null;
        })
    );
  }
  if (!calls.length) return { results: [], triedAny: false, lastError: null };
  const settled = await Promise.allSettled(calls);
  const results = settled.map((s) => s.status === 'fulfilled' ? s.value : null).filter(Boolean);
  return { results, triedAny: true, lastError: null };
}

export const systemInfo = async () => {
  const live = [];
  for (const p of PROVIDERS) {
    // eslint-disable-next-line no-await-in-loop
    const key = await resolveKey(p.keyName);
    live.push({ provider: p.id, model: p.model, live: Boolean(key) });
  }
  return { providers: live, failoverChain: PROVIDERS.map((p) => p.id) };
}
