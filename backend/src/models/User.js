import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const { Schema } = mongoose;

const userSchema = new Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    // select:false — sensitive, never returned to clients by default.
    passwordHash: { type: String, required: true, select: false },
    refreshToken: { type: String, select: false },

    roleSlug: { type: String, default: 'member' },
    plan: { type: String, default: 'free' },

    // When true, this user may fall back to the shared admin LLM keys.
    canUseAdminKeys: { type: Boolean, default: false },
    // Pending request to be granted shared-key access (cleared when granted).
    keyAccessRequested: { type: Boolean, default: false },

    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

// Hash plaintext assigned to passwordHash. Callers assign plaintext; never hash manually.
userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('passwordHash')) return next();
  // Skip if already a bcrypt hash (idempotent re-saves).
  if (/^\$2[aby]\$/.test(this.passwordHash)) return next();
  this.passwordHash = await bcrypt.hash(this.passwordHash, 10);
  next();
});

userSchema.methods.comparePassword = function comparePassword(plaintext) {
  return bcrypt.compare(plaintext, this.passwordHash);
};

// Safe projection for API responses.
userSchema.methods.toPublic = function toPublic() {
  return {
    id: this._id.toString(),
    fullName: this.fullName,
    email: this.email,
    roleSlug: this.roleSlug,
    plan: this.plan,
    canUseAdminKeys: this.canUseAdminKeys,
    keyAccessRequested: this.keyAccessRequested,
    createdAt: this.createdAt,
  };
};

export const User = mongoose.model('User', userSchema);
