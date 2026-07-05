import mongoose from 'mongoose';
import { systemInfo as llmSystemInfo } from './llmService.js';
import { precedentRepository } from '../repositories/precedentRepository.js';
import { complianceFramework } from '../data/complianceFramework.js';

export const systemService = {
  async health() {
    return {
      status: 'ok',
      uptimeSec: Math.round(process.uptime()),
      mongo: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      time: new Date().toISOString(),
    };
  },

  async info() {
    const [llm, precedents] = await Promise.all([llmSystemInfo(), precedentRepository.count().catch(() => 0)]);
    return {
      name: 'SecureShield',
      agents: 5,
      tools: 18,
      precedents,
      compliance: complianceFramework,
      ...llm,
    };
  },
};
