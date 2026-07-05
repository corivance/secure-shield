import mongoose from 'mongoose';

const { Schema } = mongoose;

// User-facing notifications emitted by pipeline events (checks, disputes, uploads).
const notificationSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: ['eligibility', 'dispute', 'policy', 'account', 'compliance', 'request', 'system'],
      default: 'system',
    },
    title: { type: String, required: true },
    body: { type: String, default: '' },
    // Optional in-app deep link (e.g. /checks/:id) the item navigates to.
    link: { type: String, default: '' },
    read: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, createdAt: -1 });

export const Notification = mongoose.model('Notification', notificationSchema);
