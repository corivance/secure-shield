import mongoose from 'mongoose';

const { Schema } = mongoose;

const eligibilityCheckSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    policy: { type: Schema.Types.ObjectId, ref: 'Policy', required: true },

    // Raw + enriched case facts.
    caseInput: { type: Schema.Types.Mixed, default: {} },
    enriched: { type: Schema.Types.Mixed, default: {} },

    verdict: { type: String, enum: ['approved', 'partial', 'denied'], required: true },
    coveragePercent: { type: Number, default: 0 },
    eligibleAmount: { type: Number, default: 0 },
    claimedAmount: { type: Number, default: 0 },

    breakdown: { type: [Schema.Types.Mixed], default: [] },
    explanation: { type: String, default: '' },
    savings: { type: Schema.Types.Mixed, default: {} },

    pipelineRunId: { type: String, index: true },
  },
  { timestamps: true }
);

export const EligibilityCheck = mongoose.model('EligibilityCheck', eligibilityCheckSchema);
