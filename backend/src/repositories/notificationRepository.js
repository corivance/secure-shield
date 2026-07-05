import { Notification } from '../models/Notification.js';

export const notificationRepository = {
  create(data) {
    return Notification.create(data);
  },

  listByUser(userId, limit = 50) {
    return Notification.find({ user: userId }).sort({ createdAt: -1 }).limit(limit).exec();
  },

  countUnread(userId) {
    return Notification.countDocuments({ user: userId, read: false }).exec();
  },

  markRead(id, userId) {
    return Notification.findOneAndUpdate({ _id: id, user: userId }, { read: true }, { new: true }).exec();
  },

  markAllRead(userId) {
    return Notification.updateMany({ user: userId, read: false }, { read: true }).exec();
  },
};
