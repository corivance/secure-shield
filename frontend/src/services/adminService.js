import { apiClient, toApiError } from '../lib/apiClient.js';
import { ENDPOINTS } from '../constants/apiEndpoints.js';

export const adminService = {
  // ── Plans ──
  async listPlans() {
    const r = await apiClient.get(ENDPOINTS.admin.plans);
    return r.data.data.plans;
  },
  async createPlan(data) {
    try {
      const r = await apiClient.post(ENDPOINTS.admin.plans, data);
      return r.data.data.plan;
    } catch (e) {
      throw toApiError(e);
    }
  },
  async updatePlan({ id, data }) {
    try {
      const r = await apiClient.patch(ENDPOINTS.admin.plan(id), data);
      return r.data.data.plan;
    } catch (e) {
      throw toApiError(e);
    }
  },
  async deletePlan(id) {
    try {
      await apiClient.delete(ENDPOINTS.admin.plan(id));
      return true;
    } catch (e) {
      throw toApiError(e);
    }
  },

  // ── API keys ──
  async listApiKeys() {
    const r = await apiClient.get(ENDPOINTS.admin.apiKeys);
    return r.data.data.keys;
  },
  async updateApiKey({ keyName, value, enabled }) {
    try {
      const r = await apiClient.patch(ENDPOINTS.admin.apiKey(keyName), { value, enabled });
      return r.data.data.key;
    } catch (e) {
      throw toApiError(e);
    }
  },

  // ── Users ──
  async listUsers() {
    const r = await apiClient.get(ENDPOINTS.admin.users);
    return r.data.data; // { users, roles, plans }
  },
  async updateUser({ id, patch }) {
    try {
      const r = await apiClient.patch(ENDPOINTS.admin.user(id), patch);
      return r.data.data.user;
    } catch (e) {
      throw toApiError(e);
    }
  },
  async deleteUser(id) {
    try {
      await apiClient.delete(ENDPOINTS.admin.user(id));
      return true;
    } catch (e) {
      throw toApiError(e);
    }
  },

  // ── Regulations ──
  async listRegulations() {
    const r = await apiClient.get(ENDPOINTS.admin.regulations);
    return r.data.data.regulations;
  },
  async createRegulation(data) {
    try {
      const r = await apiClient.post(ENDPOINTS.admin.regulations, data);
      return r.data.data.regulation;
    } catch (e) {
      throw toApiError(e);
    }
  },
  async updateRegulation({ id, data }) {
    try {
      const r = await apiClient.patch(ENDPOINTS.admin.regulation(id), data);
      return r.data.data.regulation;
    } catch (e) {
      throw toApiError(e);
    }
  },
  async deleteRegulation(id) {
    try {
      await apiClient.delete(ENDPOINTS.admin.regulation(id));
      return true;
    } catch (e) {
      throw toApiError(e);
    }
  },

  // Returns { ok, model, generatedAt, text, sources } or { ok:false, error }.
  async fetchRegulationUpdates() {
    const r = await apiClient.post(ENDPOINTS.admin.fetchRegulationUpdates);
    return r.data.data;
  },

  // Reads a circular PDF → { ok, text, summarized } for prefilling the editor.
  async extractCircular(url) {
    const r = await apiClient.post(ENDPOINTS.admin.extractCircular, { url });
    return r.data.data;
  },

  // Bulk-insert selected circulars → { ok, inserted, results }.
  async insertCirculars(items) {
    try {
      const r = await apiClient.post(ENDPOINTS.admin.insertCirculars, { items });
      return r.data.data;
    } catch (e) {
      throw toApiError(e);
    }
  },
};
