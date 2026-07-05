import { apiClient, bareClient, tokenStore, toApiError } from '../lib/apiClient.js';
import { ENDPOINTS } from '../constants/apiEndpoints.js';

export const authService = {
  async signup(payload) {
    try {
      const r = await bareClient.post(ENDPOINTS.auth.signup, payload);
      tokenStore.set(r.data.data);
      return r.data.data;
    } catch (e) {
      throw toApiError(e);
    }
  },

  async login(payload) {
    try {
      const r = await bareClient.post(ENDPOINTS.auth.login, payload);
      tokenStore.set(r.data.data);
      return r.data.data;
    } catch (e) {
      throw toApiError(e);
    }
  },

  async me() {
    const r = await apiClient.get(ENDPOINTS.auth.me);
    return r.data.data.user;
  },

  async updateProfile(payload) {
    try {
      const r = await apiClient.patch(ENDPOINTS.auth.profile, payload);
      return r.data.data.user;
    } catch (e) {
      throw toApiError(e);
    }
  },

  async changePassword(payload) {
    try {
      const r = await apiClient.post(ENDPOINTS.auth.changePassword, payload);
      return r.data.data;
    } catch (e) {
      throw toApiError(e);
    }
  },

  async logout() {
    try {
      await apiClient.post(ENDPOINTS.auth.logout);
    } finally {
      tokenStore.clear();
    }
  },
};
