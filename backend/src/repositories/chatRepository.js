import { ChatMessage } from '../models/ChatMessage.js';

export const chatRepository = {
  create(data) {
    return ChatMessage.create(data);
  },

  listByUser(userId, limit = 50) {
    return ChatMessage.find({ user: userId }).sort({ createdAt: -1 }).limit(limit).exec();
  },
};
