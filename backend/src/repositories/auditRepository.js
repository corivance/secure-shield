import { AuditLog } from '../models/AuditLog.js';

export const auditRepository = {
  record(entry) {
    return AuditLog.create(entry);
  },

  listByUser(userId, limit = 200) {
    return AuditLog.find({ user: userId }).sort({ createdAt: -1 }).limit(limit).exec();
  },

  listByRun(pipelineRunId) {
    return AuditLog.find({ pipelineRunId }).sort({ createdAt: 1 }).exec();
  },
};
