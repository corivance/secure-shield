import { notificationService } from '../services/notificationService.js';
import { ok } from '../utils/respond.js';

export const notificationController = {
  async list(req, res) {
    const [notifications, unread] = await Promise.all([
      notificationService.list(req.user.id),
      notificationService.unreadCount(req.user.id),
    ]);
    return ok(res, { notifications, unread }, 'OK');
  },

  async unreadCount(req, res) {
    const unread = await notificationService.unreadCount(req.user.id);
    return ok(res, { unread }, 'OK');
  },

  async markRead(req, res) {
    const notification = await notificationService.markRead(req.params.id, req.user.id);
    return ok(res, { notification }, 'Marked read');
  },

  async markAllRead(req, res) {
    await notificationService.markAllRead(req.user.id);
    return ok(res, {}, 'All marked read');
  },
};
