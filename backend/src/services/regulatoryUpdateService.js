import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import axios from 'axios';
import { resolveKey } from './keyService.js';
import { pdfTextExtractor } from '../tools/pdfTools.js';
import { complete } from './llmService.js';
import { regulationService } from './regulationService.js';
import { regulationRepository } from '../repositories/regulationRepository.js';
import { logger } from '../utils/logger.js';

const srcKey = (u) => String(u || '').split('?')[0];
const MAX_AUTO_INSERT = 8;

const execFileP = promisify(execFile);

const SCRIPTS_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../scripts');
const AI_SCRIPT = path.join(SCRIPTS_DIR, 'fetch-irdai-updates.sh'); // Gemini + Google Search grounding (needs key)
const SCRAPE_SCRIPT = path.join(SCRIPTS_DIR, 'scrape-irdai-circulars.sh'); // no key — scrapes irdai.gov.in

const runScript = async (script, env) => {
  try {
    const { stdout } = await execFileP('bash', [script], {
      env,
      timeout: 75_000,
      maxBuffer: 4 * 1024 * 1024,
    });
    try {
      return JSON.parse(stdout);
    } catch {
      return { ok: false, error: 'Could not parse the research script output.' };
    }
  } catch (err) {
    logger.warn(`regulatory update fetch failed: ${err.message}`);
    return { ok: false, error: err.killed ? 'The research request timed out.' : err.message };
  }
};

export const regulatoryUpdateService = {
  // With a Gemini key → richer AI summary (Google Search grounding).
  // Without one → fall back to scraping IRDAI's own circulars page (no key).
  async fetchLatest() {
    const key = (await resolveKey('GEMINI_API_KEY')) || '';
    if (key) {
      return runScript(AI_SCRIPT, { ...process.env, GEMINI_API_KEY: key });
    }
    return runScript(SCRAPE_SCRIPT, process.env);
  },

  // Always the structured scraper (returns { items: [...] }).
  async scrape() {
    return runScript(SCRAPE_SCRIPT, process.env);
  },

  // Scrape IRDAI and AUTO-INSERT new health-related circulars as `info`
  // provisions (deduped by source URL). No AI required, no per-item permission.
  // Each item gets a `status`: inserted | existing | skipped.
  async fetchAndSync() {
    const res = await this.scrape();
    if (!res.ok || !Array.isArray(res.items)) return res;

    const existing = await regulationRepository.all().catch(() => []);
    const existingKeys = new Set(existing.map((r) => srcKey(r.source)).filter(Boolean));

    let inserted = 0;
    for (const it of res.items) {
      const key = srcKey(it.url);
      if (existingKeys.has(key)) {
        it.status = 'existing';
        continue;
      }
      // Only health-related circulars are auto-inserted; the rest stay manual (+ Add).
      if (!it.health || inserted >= MAX_AUTO_INSERT) {
        it.status = 'skipped';
        continue;
      }
      let text = '';
      try {
        const ex = await this.extractCircular(it.url);
        if (ex.ok) text = ex.text;
      } catch {
        /* keep going with empty text */
      }
      // The PDF may be a scanned image with no extractable text — fall back so
      // the (required) text field is never empty.
      const provisionText = text && text.trim() ? text.trim() : `Imported from an IRDAI circular — open the source PDF for the full text: ${it.title}.`;
      try {
        await regulationService.create({
          title: it.title,
          text: provisionText,
          ref: '',
          code: '',
          source: it.url,
          appliesTo: [],
          category: 'info',
          enabled: true,
        });
        existingKeys.add(key);
        it.status = 'inserted';
        inserted += 1;
      } catch (err) {
        logger.warn(`auto-insert failed for "${it.title}": ${err.message}`);
        it.status = 'skipped';
      }
    }

    if (inserted) logger.info(`IRDAI sync: auto-inserted ${inserted} new health circular(s).`);
    return { ...res, inserted };
  },

  // Bulk-insert an explicit list of circulars (from checkbox selection), deduped
  // by source URL. Each gets its PDF text extracted (no AI). Returns per-item results.
  async insertCirculars(items = []) {
    const existing = await regulationRepository.all().catch(() => []);
    const existingKeys = new Set(existing.map((r) => srcKey(r.source)).filter(Boolean));

    let inserted = 0;
    const results = [];
    for (const it of items) {
      if (!it?.url || !it?.title) {
        results.push({ url: it?.url, status: 'skipped' });
        continue;
      }
      const key = srcKey(it.url);
      if (existingKeys.has(key)) {
        results.push({ url: it.url, status: 'existing' });
        continue;
      }
      let text = '';
      try {
        const ex = await this.extractCircular(it.url);
        if (ex.ok) text = ex.text;
      } catch {
        /* fall back below */
      }
      const provisionText = text && text.trim() ? text.trim() : `Imported from an IRDAI circular — open the source PDF for the full text: ${it.title}.`;
      try {
        await regulationService.create({
          title: it.title,
          text: provisionText,
          ref: '',
          code: '',
          source: it.url,
          appliesTo: [],
          category: 'info',
          enabled: true,
        });
        existingKeys.add(key);
        inserted += 1;
        results.push({ url: it.url, status: 'inserted' });
      } catch (err) {
        logger.warn(`bulk insert failed for "${it.title}": ${err.message}`);
        results.push({ url: it.url, status: 'skipped' });
      }
    }
    return { ok: true, inserted, results };
  },

  // Download an IRDAI circular PDF, extract its text, and (if an LLM key is
  // configured) summarise it into a concise provision for the "+ Add" prefill.
  // Restricted to irdai.gov.in to avoid server-side request forgery.
  async extractCircular(url) {
    let host;
    try {
      host = new URL(url).hostname;
    } catch {
      return { ok: false, error: 'Invalid URL.' };
    }
    if (host !== 'irdai.gov.in') {
      return { ok: false, error: 'Only irdai.gov.in documents can be read.' };
    }

    let buffer;
    try {
      const resp = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 30_000,
        maxContentLength: 20 * 1024 * 1024,
        headers: { 'User-Agent': 'Mozilla/5.0 (SecureShield compliance reviewer)' },
      });
      buffer = Buffer.from(resp.data);
    } catch (err) {
      return { ok: false, error: `Could not download the PDF (${err.message}).` };
    }

    const { text } = await pdfTextExtractor(buffer);
    const cleaned = String(text || '').replace(/\s+/g, ' ').trim();
    if (!cleaned) return { ok: false, error: 'The PDF had no extractable text (it may be a scanned image).' };
    // IRDAI PDFs are bilingual; strip Devanagari so the no-LLM fallback is English-only.
    const englishOnly = cleaned
      .replace(/[ऀ-ॿ]+/g, ' ') // Devanagari
      .replace(/�+/g, ' ') // replacement chars
      .replace(/\s*\/\s*(?=\/|\s|$)/g, ' ') // stray separators
      .replace(/\s{2,}/g, ' ')
      .trim();

    // Summarise into a clean provision when any LLM provider is configured.
    const { text: summary, degraded } = await complete({
      system:
        'You convert an IRDAI circular into ONE concise, plain-English provision (2-4 sentences). State the rule/requirement only — no preamble, no markdown.',
      prompt: `Summarise this IRDAI circular into a single provision:\n"""${cleaned.slice(0, 6000)}"""`,
      temperature: 0.2,
    });

    return {
      ok: true,
      text: !degraded && summary ? summary.trim() : englishOnly.slice(0, 1500),
      summarized: !degraded && Boolean(summary),
      chars: cleaned.length,
    };
  },
};
