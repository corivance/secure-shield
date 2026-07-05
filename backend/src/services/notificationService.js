import { notificationRepository } from '../repositories/notificationRepository.js';
import { logger } from '../utils/logger.js';

export const notificationService = {
  list(userId) {
    return notificationRepository.listByUser(userId);
  },

  unreadCount(userId) {
    return notificationRepository.countUnread(userId);
  },

  markRead(id, userId) {
    return notificationRepository.markRead(id, userId);
  },

  markAllRead(userId) {
    return notificationRepository.markAllRead(userId);
  },

  // Fire-and-forget emit used by other services on pipeline events. Never throws
  // into the caller — a failed notification must not fail the underlying action.
  async emit({ userId, type, title, body = '', link = '' }) {
    try {
      return await notificationRepository.create({ user: userId, type, title, body, link });
    } catch (err) {
      logger.warn(`notification emit failed: ${err.message}`);
      return null;
    }
  },
};
