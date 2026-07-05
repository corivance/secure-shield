import { auditRepository } from '../repositories/auditRepository.js';

export const auditService = {
  trail(userId) {
    return auditRepository.listByUser(userId);
  },
  run(pipelineRunId) {
    return auditRepository.listByRun(pipelineRunId);
  },
};
