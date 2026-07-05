import { policyRepository } from '../repositories/policyRepository.js';
import { runPolicyAgent } from '../agents/policyAgent.js';
import { createAuditContext } from '../agents/auditTrail.js';
import { ruleValidator } from '../tools/policyTools.js';
import { notificationService } from './notificationService.js';
import { planService } from './planService.js';
import { AppError } from '../utils/AppError.js';

export const policyService = {
  // Ingest a PDF: run the Policy Agent, then create a FROZEN policy.
  async ingest({ userId, buffer, originalName }) {
    await planService.checkLimit(userId, 'policies');
    const audit = createAuditContext({ userId });
    const result = await runPolicyAgent({ buffer, audit, userId });

    if (!result.validation.valid && result.rules.length === 0) {
      throw new AppError('Could not extract any rules from this policy PDF', 422, 'EXTRACTION_FAILED', { issues: result.validation.issues });
    }

    const policy = await policyRepository.create({
      user: userId,
      planName: result.meta.planName,
      insurer: result.meta.insurer,
      sumInsured: result.meta.sumInsured,
      sourceFile: originalName,
      rawTextSnippet: result.rawTextSnippet,
      rules: result.rules,
      frozen: true,
      frozenAt: new Date(),
    });

    await notificationService.emit({
      userId,
      type: 'policy',
      title: 'Policy uploaded & rules frozen',
      body: `${policy.planName} (${policy.insurer}) — ${policy.rules.length} rules extracted and frozen.`,
      link: `/policies/${policy._id}`,
    });

    return {
      policy,
      pipelineRunId: audit.runId,
      steps: audit.steps,
      extraction: { mode: result.extractionMode, note: result.extractionNote, rules: policy.rules.length },
    };
  },

  list(userId) {
    return policyRepository.listByUser(userId);
  },

  async get(id, userId) {
    const policy = await policyRepository.findByIdForUser(id, userId);
    if (!policy) throw new AppError('Policy not found', 404, 'POLICY_NOT_FOUND');
    return policy;
  },

  // Owner correction: review/fix/add rules (and meta) the AI missed or misread.
  // Rules are re-validated so a bad shape can never be saved; the policy stays
  // frozen but is flagged as manually edited. Only affects FUTURE checks.
  async updateRules(id, userId, { rules, planName, insurer, sumInsured }) {
    const existing = await policyRepository.findByIdForUser(id, userId);
    if (!existing) throw new AppError('Policy not found', 404, 'POLICY_NOT_FOUND');

    const validated = ruleValidator(Array.isArray(rules) ? rules : []);
    if (!validated.valid) {
      throw new AppError('Some rules are invalid — fix them and try again', 422, 'INVALID_RULES', { issues: validated.issues });
    }

    const update = { rules: validated.rules, manuallyEdited: true, editedAt: new Date(), frozenAt: new Date() };
    if (planName != null && String(planName).trim()) update.planName = String(planName).trim();
    if (insurer != null && String(insurer).trim()) update.insurer = String(insurer).trim();
    if (sumInsured != null) update.sumInsured = Number(sumInsured) || 0;

    const policy = await policyRepository.updateForUser(id, userId, update);
    return policy;
  },

  async delete(id, userId) {
    const policy = await policyRepository.deleteByIdForUser(id, userId);
    if (!policy) throw new AppError('Policy not found', 404, 'POLICY_NOT_FOUND');
    return { deleted: true };
  },
};
