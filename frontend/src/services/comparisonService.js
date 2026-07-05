import { apiClient, toApiError } from '../lib/apiClient.js';
import { ENDPOINTS } from '../constants/apiEndpoints.js';

export const comparisonService = {
  async create(policyIds) {
    try {
      const r = await apiClient.post(ENDPOINTS.compare.create, { policyIds });
      return r.data.data.comparison;
    } catch (e) {
      throw toApiError(e);
    }
  },

  async list() {
    const r = await apiClient.get(ENDPOINTS.compare.list);
    return r.data.data.comparisons;
  },

  async get(id) {
    const r = await apiClient.get(ENDPOINTS.compare.detail(id));
    return r.data.data.comparison;
  },

  async remove(id) {
    try {
      await apiClient.delete(ENDPOINTS.compare.remove(id));
      return true;
    } catch (e) {
      throw toApiError(e);
    }
  },
};
