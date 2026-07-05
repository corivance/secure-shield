import mongoose from 'mongoose';

const { Schema } = mongoose;

// Persists what the regulatory watch has already seen, so the weekly job can
// diff and only notify on genuinely new circulars.
const watchStateSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    seenKeys: { type: [String], default: [] },
    lastItems: { type: [Schema.Types.Mixed], default: [] },
    lastRunAt: { type: Date },
  },
  { timestamps: true }
);

export const WatchState = mongoose.model('WatchState', watchStateSchema);
