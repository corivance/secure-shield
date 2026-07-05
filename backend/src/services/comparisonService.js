import { comparisonRepository } from '../repositories/comparisonRepository.js';
import { policyRepository } from '../repositories/policyRepository.js';
import { buildRuleMatrix, generateRecommendation } from '../tools/comparisonTools.js';
import { AppError } from '../utils/AppError.js';

const MAX_COMPARE = 3;
const MIN_COMPARE = 2;

export const comparisonService = {
  async create({ userId, policyIds }) {
    if (!Array.isArray(policyIds) || policyIds.length < MIN_COMPARE) {
      throw new AppError(`Select at least ${MIN_COMPARE} policies to compare`, 400, 'TOO_FEW_POLICIES');
    }
    if (policyIds.length > MAX_COMPARE) {
      throw new AppError(`You can compare up to ${MAX_COMPARE} policies at a time`, 400, 'TOO_MANY_POLICIES');
    }

    const uniqueIds = [...new Set(policyIds)];
    const policies = await Promise.all(
      uniqueIds.map((id) => policyRepository.findByIdForUser(id, userId))
    );

    const missing = policies.findIndex((p) => !p);
    if (missing !== -1) {
      throw new AppError(`Policy not found: ${uniqueIds[missing]}`, 404, 'POLICY_NOT_FOUND');
    }

    const ruleMatrix = buildRuleMatrix(policies);

    const summary = {
      totalRules: policies.map((p) => ({ planName: p.planName, count: (p.rules || []).length })),
    };

    const recommendation = generateRecommendation(policies);

    const comparison = await comparisonRepository.create({
      user: userId,
      policies: policies.map((p) => ({
        policy: p._id,
        planName: p.planName,
        insurer: p.insurer,
        sumInsured: p.sumInsured,
        rules: p.rules,
      })),
      policyCount: policies.length,
      summary,
      ruleMatrix,
      recommendation,
    });

    return comparison;
  },

  history(userId) {
    return comparisonRepository.listByUser(userId);
  },

  async get(id, userId) {
    const comparison = await comparisonRepository.findByIdForUser(id, userId);
    if (!comparison) throw new AppError('Comparison not found', 404, 'COMPARISON_NOT_FOUND');
    return comparison;
  },

  async remove(id, userId) {
    const removed = await comparisonRepository.deleteByIdForUser(id, userId);
    if (!removed) throw new AppError('Comparison not found', 404, 'COMPARISON_NOT_FOUND');
    return { deleted: true };
  },
};
