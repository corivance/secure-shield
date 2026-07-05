import { chatService } from '../services/chatService.js';
import { ok } from '../utils/respond.js';

export const chatController = {
  async ask(req, res) {
    const { question, imageBase64 } = req.body || {};
    const result = await chatService.ask({ userId: req.user.id, question, imageBase64 });
    return ok(res, result, 'OK');
  },

  async history(req, res) {
    const messages = await chatService.history(req.user.id);
    return ok(res, { messages }, 'OK');
  },
};
