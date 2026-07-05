import { policyService } from '../services/policyService.js';
import { assertPdfMagicBytes } from '../middlewares/upload.js';
import { ok } from '../utils/respond.js';
import { AppError } from '../utils/AppError.js';

export const policyController = {
  async upload(req, res) {
    if (!req.file) throw new AppError('No PDF uploaded (field name must be "policy")', 400, 'NO_FILE');
    assertPdfMagicBytes(req.file.buffer);

    const result = await policyService.ingest({
      userId: req.user.id,
      buffer: req.file.buffer,
      originalName: req.file.originalname,
    });
    return ok(res, result, 'Policy uploaded and rules frozen', 201);
  },

  async list(req, res) {
    const policies = await policyService.list(req.user.id);
    return ok(res, { policies }, 'OK');
  },

  async get(req, res) {
    const policy = await policyService.get(req.params.id, req.user.id);
    return ok(res, { policy }, 'OK');
  },

  async update(req, res) {
    const policy = await policyService.updateRules(req.params.id, req.user.id, req.body || {});
    return ok(res, { policy }, 'Policy rules updated');
  },

  async remove(req, res) {
    const result = await policyService.delete(req.params.id, req.user.id);
    return ok(res, result, 'Policy deleted');
  },
};
