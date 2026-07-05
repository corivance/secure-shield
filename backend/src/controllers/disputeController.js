import path from 'node:path';
import fs from 'node:fs';
import { disputeService } from '../services/disputeService.js';
import { REPORTS_DIR } from '../tools/reportTool.js';
import { ok } from '../utils/respond.js';
import { AppError } from '../utils/AppError.js';

export const disputeController = {
  async create(req, res) {
    const { checkId } = req.body || {};
    if (!checkId) throw new AppError('checkId is required', 400, 'CHECK_REQUIRED');
    const dispute = await disputeService.start({ userId: req.user.id, checkId });
    return ok(res, { dispute }, 'Dispute started', 201);
  },

  async get(req, res) {
    const dispute = await disputeService.get(req.params.id, req.user.id);
    if (!dispute) throw new AppError('Dispute not found', 404, 'DISPUTE_NOT_FOUND');
    return ok(res, { dispute }, 'OK');
  },

  // Download generated PDF report. Path-traversal protected via path.basename().
  async download(req, res) {
    const safeName = path.basename(req.params.filename);
    const filePath = path.join(REPORTS_DIR, safeName);
    if (!filePath.startsWith(REPORTS_DIR) || !fs.existsSync(filePath)) {
      throw new AppError('Report not found', 404, 'REPORT_NOT_FOUND');
    }
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${safeName}"`);
    fs.createReadStream(filePath).pipe(res);
  },
};
