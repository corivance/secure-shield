import { comparisonService } from '../services/comparisonService.js';
import { ok } from '../utils/respond.js';
import { AppError } from '../utils/AppError.js';

export const comparisonController = {
  async create(req, res) {
    const { policyIds } = req.body || {};
    if (!Array.isArray(policyIds) || !policyIds.length) {
      throw new AppError('policyIds array is required', 400, 'POLICY_IDS_REQUIRED');
    }
    const comparison = await comparisonService.create({ userId: req.user.id, policyIds });
    return ok(res, { comparison }, 'Comparison created', 201);
  },

  async list(req, res) {
    const comparisons = await comparisonService.history(req.user.id);
    return ok(res, { comparisons }, 'OK');
  },

  async get(req, res) {
    const comparison = await comparisonService.get(req.params.id, req.user.id);
    return ok(res, { comparison }, 'OK');
  },

  async remove(req, res) {
    const result = await comparisonService.remove(req.params.id, req.user.id);
    return ok(res, result, 'Comparison deleted');
  },
};
