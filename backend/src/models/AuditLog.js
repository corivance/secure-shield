import mongoose from 'mongoose';

const { Schema } = mongoose;

// One row per agent/tool step, keyed by pipelineRunId for full traceability.
const auditLogSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    pipelineRunId: { type: String, required: true, index: true },

    agent: { type: String, required: true },
    tool: { type: String, default: '' },
    inputSummary: { type: String, default: '' },
    outputSummary: { type: String, default: '' },
    durationMs: { type: Number, default: 0 },
    status: { type: String, enum: ['success', 'failure'], default: 'success' },
  },
  { timestamps: true }
);

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
