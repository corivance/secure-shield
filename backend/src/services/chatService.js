import { chatRepository } from '../repositories/chatRepository.js';
import { runChatAgent } from '../agents/chatAgent.js';
import { createAuditContext } from '../agents/auditTrail.js';
import { detectInjection } from '../utils/sanitize.js';
import { AppError } from '../utils/AppError.js';

export const chatService = {
  async ask({ userId, question, imageBase64 }) {
    if (!question || !question.trim()) throw new AppError('Question is required', 400, 'QUESTION_REQUIRED');
    if (detectInjection(question).flagged) throw new AppError('Input rejected by safety filter', 400, 'INJECTION_DETECTED');

    const audit = createAuditContext({ userId });
    const { answer, source, model } = await runChatAgent({ question, imageBase64, audit, userId });

    await chatRepository.create({ user: userId, question, answer, source, model });
    return { answer, source, model };
  },

  history(userId) {
    return chatRepository.listByUser(userId);
  },
};
