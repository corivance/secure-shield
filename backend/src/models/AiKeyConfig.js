import mongoose from 'mongoose';

const { Schema } = mongoose;

// Provider/API keys live here AES-256 encrypted — never in .env or code.
// Resolve with resolveKey(keyName).
const aiKeyConfigSchema = new Schema(
  {
    keyName: { type: String, required: true, unique: true, index: true },
    provider: { type: String, required: true },
    // Ciphertext only; select:false so it never leaks via generic queries.
    encryptedValue: { type: String, required: true, select: false },
    enabled: { type: Boolean, default: true },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

export const AiKeyConfig = mongoose.model('AiKeyConfig', aiKeyConfigSchema, 'ai_key_configs');
