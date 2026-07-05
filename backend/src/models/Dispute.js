import mongoose from 'mongoose';

const { Schema } = mongoose;

const disputeSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    check: { type: Schema.Types.ObjectId, ref: 'EligibilityCheck', required: true },

    precedents: { type: [Schema.Types.Mixed], default: [] },
    letter: { type: String, default: '' },

    reportFile: { type: String },

    status: { type: String, enum: ['queued', 'processing', 'ready', 'failed'], default: 'queued' },
    pipelineRunId: { type: String, index: true },
    error: { type: String },
  },
  { timestamps: true }
);

export const Dispute = mongoose.model('Dispute', disputeSchema);
