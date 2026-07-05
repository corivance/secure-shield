import { userKeyService } from '../services/userKeyService.js';
import { ok } from '../utils/respond.js';

// A user's own provider keys (and whether they may use the shared admin key).
export const userKeyController = {
  async list(req, res) {
    const result = await userKeyService.list(req.user.id);
    return ok(res, result, 'OK');
  },

  async update(req, res) {
    const { value, enabled } = req.body || {};
    const key = await userKeyService.update(req.user.id, req.params.keyName, { value, enabled });
    return ok(res, { key }, 'Saved');
  },

  async requestAccess(req, res) {
    const result = await userKeyService.requestAccess(req.user.id, req.body?.message);
    return ok(res, result, result.requested ? 'Request sent' : 'OK');
  },
};
