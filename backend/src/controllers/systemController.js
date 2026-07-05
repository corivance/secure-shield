import { systemService } from '../services/systemService.js';
import { env } from '../config/env.js';
import { ok } from '../utils/respond.js';

export const systemController = {
  async health(req, res) {
    return ok(res, await systemService.health(), 'OK');
  },

  async info(req, res) {
    return ok(res, await systemService.info(), 'OK');
  },

  // Auto-fetch the master API key for local/CLI/MCP use.
  async autoKey(req, res) {
    return ok(res, { apiKey: env.masterApiKey, header: 'X-API-Key' }, 'OK');
  },
};
