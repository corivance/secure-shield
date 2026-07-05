import { apiClient, toApiError } from '../lib/apiClient.js';
import { ENDPOINTS } from '../constants/apiEndpoints.js';

export const disputeService = {
  async create(checkId) {
    try {
      const r = await apiClient.post(ENDPOINTS.dispute.create, { checkId });
      return r.data.data.dispute;
    } catch (e) {
      throw toApiError(e);
    }
  },

  async get(id) {
    const r = await apiClient.get(ENDPOINTS.dispute.detail(id));
    return r.data.data.dispute;
  },

  async downloadBlob(filename) {
    const r = await apiClient.get(ENDPOINTS.dispute.download(filename), { responseType: 'blob' });
    return r.data;
  },
};
