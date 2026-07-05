import { apiClient, toApiError } from '../lib/apiClient.js';
import { ENDPOINTS } from '../constants/apiEndpoints.js';

export const notificationService = {
  async list() {
    const r = await apiClient.get(ENDPOINTS.notifications.list);
    return r.data.data; // { notifications, unread }
  },

  async unreadCount() {
    const r = await apiClient.get(ENDPOINTS.notifications.unreadCount);
    return r.data.data.unread;
  },

  async markRead(id) {
    try {
      const r = await apiClient.patch(ENDPOINTS.notifications.read(id));
      return r.data.data.notification;
    } catch (e) {
      throw toApiError(e);
    }
  },

  async markAllRead() {
    try {
      await apiClient.post(ENDPOINTS.notifications.readAll);
      return true;
    } catch (e) {
      throw toApiError(e);
    }
  },
};
