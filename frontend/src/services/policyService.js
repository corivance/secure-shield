import { apiClient, toApiError } from '../lib/apiClient.js';
import { ENDPOINTS } from '../constants/apiEndpoints.js';

export const policyService = {
  async upload(file) {
    const form = new FormData();
    form.append('policy', file);
    try {
      const r = await apiClient.post(ENDPOINTS.policy.upload, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return r.data.data;
    } catch (e) {
      throw toApiError(e);
    }
  },

  async list() {
    const r = await apiClient.get(ENDPOINTS.policy.list);
    return r.data.data.policies;
  },

  async get(id) {
    const r = await apiClient.get(ENDPOINTS.policy.detail(id));
    return r.data.data.policy;
  },

  async update(id, data) {
    try {
      const r = await apiClient.patch(ENDPOINTS.policy.update(id), data);
      return r.data.data.policy;
    } catch (e) {
      throw toApiError(e);
    }
  },

  async remove(id) {
    try {
      await apiClient.delete(ENDPOINTS.policy.remove(id));
      return true;
    } catch (e) {
      throw toApiError(e);
    }
  },
};
