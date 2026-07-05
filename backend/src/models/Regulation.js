import mongoose from 'mongoose';

const { Schema } = mongoose;

// IRDAI provisions SecureShield reasons over — DB-backed so a compliance reviewer
// can update them via the admin screen without a redeploy. Seeded from
// data/irdaiRegulations.js on first run.
const regulationSchema = new Schema(
  {
    code: { type: String, default: '' },
    ref: { type: String, default: '' },
    title: { type: String, required: true },
    text: { type: String, required: true },
    // Engine rule types this provision supports (room_rent, sub_limit, …).
    appliesTo: { type: [String], default: [] },
    // 'rule' = engine-relevant; 'info' = informational only.
    category: { type: String, enum: ['rule', 'info'], default: 'rule' },
    effective: { type: String, default: '' },
    source: { type: String, default: '' },
    enabled: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Regulation = mongoose.model('Regulation', regulationSchema);
