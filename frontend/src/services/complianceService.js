import { apiClient } from '../lib/apiClient.js';
import { ENDPOINTS } from '../constants/apiEndpoints.js';

export const complianceService = {
  // Read-only — any authenticated user. Returns { regulations, framework, lang }.
  // `lang` requests translated compliance content (English by default).
  async list(lang = 'en') {
    const r = await apiClient.get(ENDPOINTS.compliance.regulations, { params: { lang } });
    return r.data.data;
  },
};
