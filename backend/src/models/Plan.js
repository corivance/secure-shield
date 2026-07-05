import mongoose from 'mongoose';

const { Schema } = mongoose;

// A subscription tier. `limits` are lifetime caps on resources; -1 = unlimited.
// `price` is a one-time amount (INR). Admin-managed via Admin → Plans.
const planSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    description: { type: String, default: '' },
    price: { type: Number, default: 0 }, // one-time, in rupees
    currency: { type: String, default: 'INR' },
    limits: {
      policies: { type: Number, default: -1 },
      eligibilityChecks: { type: Number, default: -1 },
      disputes: { type: Number, default: -1 },
    },
    enabled: { type: Boolean, default: true },
    isDefault: { type: Boolean, default: false }, // plan for new signups + fallback
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Plan = mongoose.model('Plan', planSchema);
