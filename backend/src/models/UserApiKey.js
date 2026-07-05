import mongoose from 'mongoose';

const { Schema } = mongoose;

// A user's own provider key — AES-256 encrypted at rest, like ai_key_configs but
// scoped per user. Resolved before the shared admin key.
const userApiKeySchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    keyName: { type: String, required: true },
    provider: { type: String, default: '' },
    encryptedValue: { type: String, required: true, select: false },
    enabled: { type: Boolean, default: true },
  },
  { timestamps: true }
);

userApiKeySchema.index({ user: 1, keyName: 1 }, { unique: true });

export const UserApiKey = mongoose.model('UserApiKey', userApiKeySchema, 'user_api_keys');
