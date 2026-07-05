import mongoose from 'mongoose';

const { Schema } = mongoose;

const comparisonPolicySchema = new Schema(
  {
    policy: { type: Schema.Types.ObjectId, ref: 'Policy', required: true },
    planName: { type: String, required: true },
    insurer: { type: String, default: '' },
    sumInsured: { type: Number, default: 0 },
    rules: { type: Schema.Types.Mixed, default: [] },
  },
  { _id: false }
);

const comparisonSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    policies: { type: [comparisonPolicySchema], required: true },
    policyCount: { type: Number, required: true },
    summary: { type: Schema.Types.Mixed, default: {} },
    ruleMatrix: { type: Schema.Types.Mixed, default: [] },
    recommendation: { type: String, default: '' },
  },
  { timestamps: true }
);

comparisonSchema.index({ user: 1, createdAt: -1 });

export const Comparison = mongoose.model('Comparison', comparisonSchema);
