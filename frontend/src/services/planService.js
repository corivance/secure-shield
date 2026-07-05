import { apiClient, toApiError } from '../lib/apiClient.js';
import { ENDPOINTS } from '../constants/apiEndpoints.js';

export const planService = {
  // { plans, usage, currentPlan, current }
  async list() {
    const r = await apiClient.get(ENDPOINTS.plans.list);
    return r.data.data;
  },
  async checkout(planSlug) {
    try {
      const r = await apiClient.post(ENDPOINTS.plans.checkout, { planSlug });
      return r.data.data;
    } catch (e) {
      throw toApiError(e);
    }
  },
  async verify(payload) {
    try {
      const r = await apiClient.post(ENDPOINTS.plans.verify, payload);
      return r.data.data;
    } catch (e) {
      throw toApiError(e);
    }
  },
};
