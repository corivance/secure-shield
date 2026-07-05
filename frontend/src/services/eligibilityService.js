import { apiClient, toApiError } from '../lib/apiClient.js';
import { ENDPOINTS } from '../constants/apiEndpoints.js';

export const eligibilityService = {
  async check(payload) {
    try {
      const r = await apiClient.post(ENDPOINTS.eligibility.check, payload);
      return r.data.data;
    } catch (e) {
      throw toApiError(e);
    }
  },

  async history() {
    const r = await apiClient.get(ENDPOINTS.eligibility.history);
    return r.data.data.checks;
  },

  async get(id) {
    const r = await apiClient.get(ENDPOINTS.eligibility.detail(id));
    return r.data.data.check;
  },
};
