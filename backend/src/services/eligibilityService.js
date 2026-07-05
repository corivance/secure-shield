import { eligibilityRepository } from '../repositories/eligibilityRepository.js';
import { policyRepository } from '../repositories/policyRepository.js';
import { runCaseAgent } from '../agents/caseAgent.js';
import { runExplanationAgent } from '../agents/explanationAgent.js';
import { runDecisionEngine } from '../engine/decisionEngine.js';
import { createAuditContext } from '../agents/auditTrail.js';
import { notificationService } from './notificationService.js';
import { planService } from './planService.js';
import { sanitizeCaseInput } from '../utils/sanitize.js';
import { AppError } from '../utils/AppError.js';

const VERDICT_LABEL = { approved: 'approved', partial: 'partially approved', denied: 'denied' };

export const eligibilityService = {
  // Full pipeline: Case Agent (enrich) → deterministic engine → Explanation Agent.
  async check({ userId, policyId, caseInput }) {
    await planService.checkLimit(userId, 'eligibilityChecks');
    const policy = await policyRepository.findByIdForUser(policyId, userId);
    if (!policy) throw new AppError('Policy not found', 404, 'POLICY_NOT_FOUND');

    // Prompt-injection sanitization before anything reaches an LLM.
    const { sanitized, flags } = sanitizeCaseInput(caseInput);
    if (flags.length) throw new AppError('Input rejected by safety filter', 400, 'INJECTION_DETECTED', { flags });

    const audit = createAuditContext({ userId });

    const enriched = await runCaseAgent({ caseInput: sanitized, audit });

    // ── Symbolic Shield: pure deterministic verdict + money math. ──
    const decision = runDecisionEngine({ policy, caseInput: sanitized, enriched });
    await audit.log({ agent: 'DecisionEngine', tool: 'symbolic_shield', input: { policy: policy._id }, output: { verdict: decision.verdict, eligible: decision.eligibleAmount } });

    const { explanation, savings } = await runExplanationAgent({ policy, caseInput: sanitized, enriched, decision, audit, userId });

    const check = await eligibilityRepository.create({
      user: userId,
      policy: policy._id,
      caseInput: sanitized,
      enriched,
      verdict: decision.verdict,
      coveragePercent: decision.coveragePercent,
      eligibleAmount: decision.eligibleAmount,
      claimedAmount: decision.claimedAmount,
      breakdown: decision.breakdown,
      explanation,
      savings,
      pipelineRunId: audit.runId,
    });

    await notificationService.emit({
      userId,
      type: 'eligibility',
      title: `Claim ${VERDICT_LABEL[decision.verdict] || decision.verdict} — ${decision.coveragePercent}% covered`,
      body: `${sanitized.procedure} on ${policy.planName}: ₹${decision.eligibleAmount.toLocaleString('en-IN')} eligible of ₹${decision.claimedAmount.toLocaleString('en-IN')} claimed.`,
      link: `/checks/${check._id}`,
    });

    return { check, steps: audit.steps };
  },

  history(userId) {
    return eligibilityRepository.listByUser(userId);
  },

  async get(id, userId) {
    const check = await eligibilityRepository.findByIdForUser(id, userId);
    if (!check) throw new AppError('Check not found', 404, 'CHECK_NOT_FOUND');
    return check;
  },
};
