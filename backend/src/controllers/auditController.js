import { auditService } from '../services/auditService.js';
import { ok } from '../utils/respond.js';

export const auditController = {
  async trail(req, res) {
    const entries = await auditService.trail(req.user.id);
    return ok(res, { entries }, 'OK');
  },

  async run(req, res) {
    const entries = await auditService.run(req.params.runId);
    return ok(res, { entries }, 'OK');
  },
};
