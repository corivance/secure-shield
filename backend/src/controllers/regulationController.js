import { translationService } from '../services/translationService.js';
import { ok } from '../utils/respond.js';

// Member-facing, read-only view of the (enabled) regulations + framework,
// translated into the requested language (?lang=ml etc.; English by default).
export const regulationController = {
  async list(req, res) {
    const lang = String(req.query.lang || 'en');
    const data = await translationService.getCompliance(lang, req.user?.id);
    return ok(res, data, 'OK');
  },
};
