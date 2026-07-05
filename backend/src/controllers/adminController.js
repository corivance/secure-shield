import { adminUserService, ASSIGNABLE_ROLES, ASSIGNABLE_PLANS } from '../services/adminUserService.js';
import { regulationService } from '../services/regulationService.js';
import { regulatoryUpdateService } from '../services/regulatoryUpdateService.js';
import { regulatoryWatchService } from '../services/regulatoryWatchService.js';
import { aiKeyService } from '../services/aiKeyService.js';
import { planService } from '../services/planService.js';
import { translationService } from '../services/translationService.js';
import { ok } from '../utils/respond.js';
import { AppError } from '../utils/AppError.js';

export const adminController = {
  // ── Users ──
  async listUsers(req, res) {
    const [users, allPlans] = await Promise.all([adminUserService.list({ search: req.query.search }), planService.listAll()]);
    const plans = allPlans.map((p) => p.slug);
    return ok(res, { users, roles: ASSIGNABLE_ROLES, plans: plans.length ? plans : ASSIGNABLE_PLANS }, 'OK');
  },

  async getUser(req, res) {
    const user = await adminUserService.get(req.params.id);
    return ok(res, { user }, 'OK');
  },

  async updateUser(req, res) {
    const { fullName, email, roleSlug, plan, canUseAdminKeys } = req.body || {};
    const user = await adminUserService.update(req.params.id, { fullName, email, roleSlug, plan, canUseAdminKeys });
    return ok(res, { user }, 'User updated');
  },

  async deleteUser(req, res) {
    const result = await adminUserService.remove(req.params.id, req.user.id);
    return ok(res, result, 'User deleted');
  },

  // ── Regulations ──
  async listRegulations(req, res) {
    const regulations = await regulationService.list();
    return ok(res, { regulations }, 'OK');
  },

  async createRegulation(req, res) {
    const { title, text } = req.body || {};
    if (!title || !title.trim()) throw new AppError('Title is required', 400, 'TITLE_REQUIRED');
    if (!text || !text.trim()) throw new AppError('Text is required', 400, 'TEXT_REQUIRED');
    const regulation = await regulationService.create(normalizeRegulation(req.body));
    return ok(res, { regulation }, 'Regulation created', 201);
  },

  async updateRegulation(req, res) {
    const regulation = await regulationService.update(req.params.id, normalizeRegulation(req.body));
    if (!regulation) throw new AppError('Regulation not found', 404, 'REGULATION_NOT_FOUND');
    return ok(res, { regulation }, 'Regulation updated');
  },

  async deleteRegulation(req, res) {
    const removed = await regulationService.remove(req.params.id);
    if (!removed) throw new AppError('Regulation not found', 404, 'REGULATION_NOT_FOUND');
    return ok(res, { deleted: true }, 'Regulation deleted');
  },

  // Fetch the latest IRDAI circulars AND auto-insert new health-related ones.
  async fetchRegulationUpdates(req, res) {
    const result = await regulatoryUpdateService.fetchAndSync();
    return ok(res, result, result.ok ? 'OK' : 'Fetch unavailable');
  },

  // Bulk-insert selected circulars from the sync modal.
  async insertCirculars(req, res) {
    const { items } = req.body || {};
    if (!Array.isArray(items) || !items.length) throw new AppError('No circulars selected', 400, 'NO_ITEMS');
    const result = await regulatoryUpdateService.insertCirculars(items);
    return ok(res, result, `Inserted ${result.inserted}`);
  },

  // Read a circular PDF and return text/summary to prefill the "+ Add" form.
  async extractCircular(req, res) {
    const { url } = req.body || {};
    if (!url) throw new AppError('A circular URL is required', 400, 'URL_REQUIRED');
    const result = await regulatoryUpdateService.extractCircular(url);
    return ok(res, result, result.ok ? 'OK' : 'Extraction failed');
  },

  // Run the weekly IRDAI watch on demand (diff + notify super-admins).
  async runRegulationWatch(req, res) {
    const result = await regulatoryWatchService.runWeeklyCheck();
    return ok(res, result, result.ok ? 'Watch complete' : 'Watch failed');
  },

  // ── API keys (AES-encrypted in ai_key_configs; values never returned) ──
  async listApiKeys(req, res) {
    const keys = await aiKeyService.list();
    return ok(res, { keys }, 'OK');
  },

  async updateApiKey(req, res) {
    const { value, enabled } = req.body || {};
    const key = await aiKeyService.update(req.params.keyName, { value, enabled });
    return ok(res, { key }, 'Saved');
  },

  // ── Plans ──
  async listPlans(req, res) {
    const plans = await planService.listAll();
    return ok(res, { plans }, 'OK');
  },
  async createPlan(req, res) {
    const plan = await planService.create(normalizePlan(req.body, true));
    return ok(res, { plan }, 'Plan created', 201);
  },
  async updatePlan(req, res) {
    const plan = await planService.update(req.params.id, normalizePlan(req.body, false));
    return ok(res, { plan }, 'Plan updated');
  },
  async deletePlan(req, res) {
    const result = await planService.remove(req.params.id);
    return ok(res, result, 'Plan deleted');
  },

  // ── Compliance translations (review & correct machine output) ──
  async listTranslations(req, res) {
    const { entityType, lang } = req.query;
    const translations = await translationService.listOverrides({ entityType, lang });
    return ok(res, { translations }, 'OK');
  },
  async setTranslation(req, res) {
    const { entityType, entityId, field, lang, value, source } = req.body || {};
    if (!entityType || !entityId || !field || !lang || value == null) {
      throw new AppError('entityType, entityId, field, lang and value are required', 400, 'INVALID_TRANSLATION');
    }
    const translation = await translationService.setOverride({ entityType, entityId, field, lang, value, source });
    return ok(res, { translation }, 'Translation saved');
  },
};

const num = (v, d) => (v === '' || v == null || Number.isNaN(Number(v)) ? d : Number(v));

const normalizePlan = (body = {}, isCreate) => {
  const patch = {};
  if (isCreate || body.slug !== undefined) patch.slug = String(body.slug || '').trim().toLowerCase();
  if (body.name !== undefined) patch.name = String(body.name || '').trim();
  if (body.description !== undefined) patch.description = body.description;
  if (body.price !== undefined) patch.price = Math.max(0, num(body.price, 0));
  if (body.enabled !== undefined) patch.enabled = Boolean(body.enabled);
  if (body.isDefault !== undefined) patch.isDefault = Boolean(body.isDefault);
  if (body.order !== undefined) patch.order = num(body.order, 0);
  if (body.limits) {
    patch.limits = {
      policies: num(body.limits.policies, -1),
      eligibilityChecks: num(body.limits.eligibilityChecks, -1),
      disputes: num(body.limits.disputes, -1),
    };
  }
  return patch;
};

const RULE_TYPES = ['room_rent', 'sub_limit', 'waiting_period', 'co_pay', 'deductible', 'exclusion'];

// Accept appliesTo as an array or comma-separated string; clamp to known types.
const normalizeRegulation = (body = {}) => {
  let appliesTo = body.appliesTo;
  if (typeof appliesTo === 'string') appliesTo = appliesTo.split(',').map((s) => s.trim()).filter(Boolean);
  appliesTo = (appliesTo || []).filter((t) => RULE_TYPES.includes(t));
  const patch = {
    code: body.code,
    ref: body.ref,
    title: body.title?.trim(),
    text: body.text?.trim(),
    appliesTo,
    category: body.category === 'info' ? 'info' : 'rule',
    effective: body.effective,
    source: body.source,
  };
  if (body.enabled != null) patch.enabled = Boolean(body.enabled);
  // Drop undefined keys so PATCH only sets provided fields.
  return Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined));
};
