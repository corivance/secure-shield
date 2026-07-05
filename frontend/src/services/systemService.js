import { apiClient, bareClient, tokenStore } from '../lib/apiClient.js';
import { ENDPOINTS } from '../constants/apiEndpoints.js';

export const systemService = {
  async info() {
    const r = await bareClient.get(ENDPOINTS.system.info);
    return r.data.data;
  },

  async health() {
    const r = await bareClient.get(ENDPOINTS.system.health);
    return r.data.data;
  },

  // Auto-fetch the master API key for CLI/MCP use and store it locally.
  async fetchApiKey() {
    const r = await apiClient.get(ENDPOINTS.system.autoKey);
    tokenStore.setApiKey(r.data.data.apiKey);
    return r.data.data;
  },
};
