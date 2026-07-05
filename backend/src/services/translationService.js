import { translationRepository } from '../repositories/translationRepository.js';
import { regulationService } from './regulationService.js';
import { complianceFramework } from '../data/complianceFramework.js';
import { complete } from './llmService.js';
import { LANG_NAMES, isSupportedLang } from '../data/languages.js';
import { logger } from '../utils/logger.js';

const FRAMEWORK_FIELDS = ['label', 'labelLong', 'disclaimer'];
const REG_FIELDS = ['title', 'text'];
const CHUNK = 12; // strings per LLM call — keeps output within token limits

// Translate a small batch of strings in one LLM call. Returns the same number of
// strings, in order. On any failure it returns the English originals (so the
// page never breaks — it just stays English for those items).
const translateBatch = async (sources, lang, userId) => {
  if (!sources.length) return [];
  const langName = LANG_NAMES[lang] || lang;
  const numbered = sources.map((s, i) => `${i + 1}. ${String(s).replace(/\s+/g, ' ').trim()}`).join('\n');
  const system =
    `You are a professional translator for Indian health-insurance regulatory text. ` +
    `Translate accurately and naturally into ${langName} so an ordinary policyholder can understand it. ` +
    `Keep numbers, money amounts, %, dates, "IRDAI" and proper nouns intact. ` +
    `Return ONLY a JSON array of strings — one translation per numbered line, in the same order. No commentary, no markdown.`;
  const prompt = `Translate each of these ${sources.length} lines into ${langName}:\n\n${numbered}\n\nReturn a JSON array of exactly ${sources.length} strings.`;

  try {
    // Use the requesting user's key first (own, then shared admin) — same as policy extraction.
    const { text, degraded } = await complete({ prompt, system, temperature: 0, maxTokens: 2200, useCache: true, userId });
    if (degraded || !text) return sources;
    const arr = JSON.parse(text.slice(text.indexOf('['), text.lastIndexOf(']') + 1));
    if (Array.isArray(arr) && arr.length === sources.length) return arr.map((s) => String(s ?? ''));
  } catch (err) {
    logger.warn(`translateBatch failed (${lang}): ${err.message}`);
  }
  return sources;
};

// Chunked translation for an arbitrary number of strings.
const translateMany = async (sources, lang, userId) => {
  const out = [];
  for (let i = 0; i < sources.length; i += CHUNK) {
    // eslint-disable-next-line no-await-in-loop
    const part = await translateBatch(sources.slice(i, i + CHUNK), lang, userId);
    out.push(...part);
  }
  return out;
};

// Resolve translated values for a set of (entityId, field, source) items, using
// stored translations where fresh, and machine-translating + persisting the rest.
// Returns Map "entityId:field" -> { value, machineTranslated }.
const resolveFields = async (entityType, lang, items, userId) => {
  const result = new Map();
  const stored = await translationRepository.findFor(entityType, lang).catch(() => []);
  const byKey = new Map(stored.map((t) => [`${t.entityId}:${t.field}`, t]));

  const missing = [];
  for (const it of items) {
    const cur = byKey.get(`${it.entityId}:${it.field}`);
    // An admin-edited translation is authoritative — always used, never re-machined.
    // A machine translation is used only while it matches the current English.
    if (cur && cur.value && (cur.edited || cur.source === it.source)) {
      result.set(`${it.entityId}:${it.field}`, { value: cur.value, machineTranslated: cur.machine && !cur.edited });
    } else {
      missing.push(it);
    }
  }

  if (missing.length) {
    const translated = await translateMany(missing.map((m) => m.source), lang, userId);
    await Promise.all(
      missing.map((m, i) =>
        translationRepository
          .upsert({ entityType, entityId: m.entityId, field: m.field, lang, source: m.source, value: translated[i], machine: true, edited: false })
          .catch(() => {})
      )
    );
    missing.forEach((m, i) => {
      // If translation equals source it likely fell back to English — still show it.
      result.set(`${m.entityId}:${m.field}`, { value: translated[i], machineTranslated: true });
    });
  }

  return result;
};

export const translationService = {
  // Public: regulations + framework, translated into `lang` (English passes through).
  async getCompliance(lang, userId) {
    const regulations = regulationService.all();
    if (!lang || lang === 'en' || !isSupportedLang(lang)) {
      return { regulations, framework: complianceFramework, lang: 'en' };
    }

    // Regulations
    const items = [];
    for (const r of regulations) {
      for (const f of REG_FIELDS) if (r[f]) items.push({ entityId: r.id || r.ref, field: f, source: r[f] });
    }
    const map = await resolveFields('regulation', lang, items, userId);
    const translatedRegs = regulations.map((r) => {
      const id = r.id || r.ref;
      let machineTranslated = false;
      const next = { ...r };
      for (const f of REG_FIELDS) {
        const hit = map.get(`${id}:${f}`);
        if (hit) {
          next[f] = hit.value;
          machineTranslated = machineTranslated || hit.machineTranslated;
        }
      }
      next.machineTranslated = machineTranslated;
      return next;
    });

    const framework = await translationService.getFramework(lang, userId);
    return { regulations: translatedRegs, framework, lang };
  },

  async getFramework(lang, userId) {
    if (!lang || lang === 'en' || !isSupportedLang(lang)) return complianceFramework;
    const items = FRAMEWORK_FIELDS.filter((f) => complianceFramework[f]).map((f) => ({ entityId: 'default', field: f, source: complianceFramework[f] }));
    const map = await resolveFields('framework', lang, items, userId);
    const fw = { ...complianceFramework };
    let machineTranslated = false;
    for (const f of FRAMEWORK_FIELDS) {
      const hit = map.get(`default:${f}`);
      if (hit) {
        fw[f] = hit.value;
        machineTranslated = machineTranslated || hit.machineTranslated;
      }
    }
    fw.machineTranslated = machineTranslated;
    return fw;
  },

  // Admin: list stored translations (to review/correct machine output).
  listOverrides({ entityType, lang } = {}) {
    return translationRepository.list({ entityType, lang });
  },

  // Admin: set an authoritative (human-corrected) translation.
  setOverride({ entityType, entityId, field, lang, value, source }) {
    return translationRepository.upsert({ entityType, entityId, field, lang, source: source || '', value, machine: false, edited: true });
  },
};
