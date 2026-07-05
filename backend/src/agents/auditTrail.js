import crypto from 'node:crypto';
import { auditRepository } from '../repositories/auditRepository.js';
import { logger } from '../utils/logger.js';

// audit_trail_logger — records every agent/tool step keyed by a pipeline run id.
export const newRunId = () => {
  return `run_${crypto.randomBytes(8).toString('hex')}`;
}

export const createAuditContext = ({ userId, pipelineRunId }) => {
  const runId = pipelineRunId || newRunId();
  return {
    runId,
    steps: [],
    async log({ agent, tool = '', input, output, status = 'success', startedAt }) {
      const durationMs = startedAt ? Date.now() - startedAt : 0;
      const entry = {
        user: userId,
        pipelineRunId: runId,
        agent,
        tool,
        inputSummary: summarize(input),
        outputSummary: summarize(output),
        durationMs,
        status,
      };
      this.steps.push({ ...entry, at: new Date().toISOString() });
      try {
        await auditRepository.record(entry);
      } catch (err) {
        logger.warn(`audit record failed: ${err.message}`);
      }
      return entry;
    },
  };
}

const summarize = (value) => {
  if (value == null) return '';
  let s = typeof value === 'string' ? value : JSON.stringify(value);
  if (s.length > 400) s = `${s.slice(0, 400)}…`;
  return s;
}
