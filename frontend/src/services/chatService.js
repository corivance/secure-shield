import { apiClient, toApiError } from '../lib/apiClient.js';
import { ENDPOINTS } from '../constants/apiEndpoints.js';

export const chatService = {
  async ask({ question, imageBase64 }) {
    try {
      const r = await apiClient.post(ENDPOINTS.chat.ask, { question, imageBase64 });
      return r.data.data;
    } catch (e) {
      throw toApiError(e);
    }
  },

  async history() {
    const r = await apiClient.get(ENDPOINTS.chat.history);
    return r.data.data.messages;
  },
};
