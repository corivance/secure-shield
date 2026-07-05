import mongoose from 'mongoose';

const { Schema } = mongoose;

// A single frozen rule extracted from the policy PDF.
const ruleSchema = new Schema(
  {
    type: {
      type: String,
      enum: ['room_rent', 'sub_limit', 'waiting_period', 'co_pay', 'deductible', 'exclusion'],
      required: true,
    },
    label: { type: String, required: true },
    // Flexible payload per rule type (cap %, absolute ₹, months, procedure key…).
    params: { type: Schema.Types.Mixed, default: {} },
    clauseRef: { type: String, default: '' },
  },
  { _id: false }
);

const policySchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    planName: { type: String, required: true },
    insurer: { type: String, default: 'Unknown Insurer' },
    sumInsured: { type: Number, default: 0 },

    sourceFile: { type: String },
    rawTextSnippet: { type: String },

    rules: { type: [ruleSchema], default: [] },

    // Once true, rules are immutable to guarantee reproducible verdicts.
    frozen: { type: Boolean, default: false },
    frozenAt: { type: Date },

    // Set when the owner manually corrects/adds rules after upload. The policy
    // stays frozen (reproducible) — this just records that a human amended it.
    manuallyEdited: { type: Boolean, default: false },
    editedAt: { type: Date },
  },
  { timestamps: true }
);

export const Policy = mongoose.model('Policy', policySchema);
