import { apiClient } from '../lib/apiClient.js';
import { ENDPOINTS } from '../constants/apiEndpoints.js';

export const auditService = {
  async trail() {
    const r = await apiClient.get(ENDPOINTS.audit.trail);
    return r.data.data.entries;
  },
};
