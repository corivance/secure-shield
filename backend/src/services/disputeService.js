import { disputeRepository } from '../repositories/disputeRepository.js';
import { eligibilityRepository } from '../repositories/eligibilityRepository.js';
import { userRepository } from '../repositories/userRepository.js';
import { runGrievanceAgent } from '../agents/grievanceAgent.js';
import { createAuditContext } from '../agents/auditTrail.js';
import { getDisputeQueue } from '../queues/disputeQueue.js';
import { notificationService } from './notificationService.js';
import { planService } from './planService.js';
import { AppError } from '../utils/AppError.js';

export const disputeService = {
  // Enqueue a grievance pipeline (long-running: precedent search + LLM + PDF).
  async start({ userId, checkId }) {
    await planService.checkLimit(userId, 'disputes');
    const check = await eligibilityRepository.findByIdForUser(checkId, userId);
    if (!check) throw new AppError('Eligibility check not found', 404, 'CHECK_NOT_FOUND');
    if (check.verdict === 'approved') throw new AppError('Approved claims cannot be disputed', 400, 'NOT_DISPUTABLE');

    const dispute = await disputeRepository.create({
      user: userId,
      check: check._id,
      status: 'queued',
      pipelineRunId: check.pipelineRunId,
    });

    const queue = getDisputeQueue();
    if (queue) {
      await queue.add('process-dispute', { disputeId: dispute._id.toString(), userId, checkId: check._id.toString() });
    } else {
      // No Redis/Bull — run inline so the feature still works in dev.
      await disputeService.process({ disputeId: dispute._id.toString(), userId, checkId: check._id.toString() });
    }
    return disputeRepository.findByIdForUser(dispute._id, userId);
  },

  // Actual work — invoked by the worker (or inline fallback).
  async process({ disputeId, userId, checkId }) {
    await disputeRepository.update(disputeId, { status: 'processing' });
    try {
      const [user, check] = await Promise.all([
        userRepository.findById(userId),
        eligibilityRepository.findByIdForUser(checkId, userId),
      ]);
      const audit = createAuditContext({ userId, pipelineRunId: check.pipelineRunId });
      const { precedents, letter, reportFile } = await runGrievanceAgent({ user, policy: check.policy, check, audit });
      const updated = await disputeRepository.update(disputeId, { status: 'ready', precedents, letter, reportFile });
      await notificationService.emit({
        userId,
        type: 'dispute',
        title: 'Grievance report ready',
        body: `Your IRDAI-backed dispute for ${check.policy?.planName || 'your policy'} is ready to download.`,
        link: `/disputes?id=${disputeId}`,
      });
      return updated;
    } catch (err) {
      await disputeRepository.update(disputeId, { status: 'failed', error: err.message });
      throw err;
    }
  },

  get(id, userId) {
    return disputeRepository.findByIdForUser(id, userId);
  },
};
