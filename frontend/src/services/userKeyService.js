import { apiClient, toApiError } from '../lib/apiClient.js';
import { ENDPOINTS } from '../constants/apiEndpoints.js';

export const userKeyService = {
  // Returns { keys, canUseAdminKeys }.
  async list() {
    const r = await apiClient.get(ENDPOINTS.auth.apiKeys);
    return r.data.data;
  },
  async update({ keyName, value, enabled }) {
    try {
      const r = await apiClient.patch(ENDPOINTS.auth.apiKey(keyName), { value, enabled });
      return r.data.data.key;
    } catch (e) {
      throw toApiError(e);
    }
  },
  async requestAccess(message) {
    try {
      const r = await apiClient.post(ENDPOINTS.auth.requestApiKey, { message });
      return r.data.data;
    } catch (e) {
      throw toApiError(e);
    }
  },
};
