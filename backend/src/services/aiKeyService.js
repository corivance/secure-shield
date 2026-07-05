import { aiKeyRepository } from '../repositories/aiKeyRepository.js';
import { encrypt, decrypt } from '../utils/crypto.js';
import { AppError } from '../utils/AppError.js';

// The provider keys SecureShield can use. The UI renders these; DB rows hold the
// actual (encrypted) values. Adding a provider here surfaces it in Admin → API Keys.
export const KEY_CATALOG = [
  { keyName: 'CEREBRAS_API_KEY', provider: 'cerebras', label: 'Cerebras', purpose: 'LLM — policy rule extraction & chat (free tier)', url: 'https://cloud.cerebras.ai' },
  { keyName: 'GROQ_API_KEY', provider: 'groq', label: 'Groq', purpose: 'LLM — policy rule extraction & chat (free tier)', url: 'https://console.groq.com/keys' },
  { keyName: 'OPENROUTER_API_KEY', provider: 'openrouter', label: 'OpenRouter', purpose: 'LLM fallback', url: 'https://openrouter.ai/keys' },
  { keyName: 'GEMINI_API_KEY', provider: 'gemini', label: 'Google Gemini', purpose: 'AI-summarised IRDAI sync (optional)', url: 'https://aistudio.google.com/app/apikey' },
  { keyName: 'GOOGLE_VISION_API_KEY', provider: 'google', label: 'Google Vision', purpose: 'OCR for chat document uploads (optional)', url: 'https://console.cloud.google.com' },
  { keyName: 'RAZORPAY_KEY_ID', provider: 'razorpay', label: 'Razorpay Key ID', purpose: 'Plan upgrade payments — public key id', url: 'https://dashboard.razorpay.com/app/keys' },
  { keyName: 'RAZORPAY_KEY_SECRET', provider: 'razorpay', label: 'Razorpay Key Secret', purpose: 'Plan upgrade payments — secret (verifies payments)', url: 'https://dashboard.razorpay.com/app/keys' },
];

// A key is "set" only if its ciphertext decrypts to a non-empty string.
const isSet = (doc) => {
  if (!doc?.encryptedValue) return false;
  try {
    return Boolean(decrypt(doc.encryptedValue));
  } catch {
    return false;
  }
};

export const aiKeyService = {
  // Never returns the decrypted value — only whether it's set + enabled.
  async list() {
    const docs = await aiKeyRepository.listAll();
    const byName = new Map(docs.map((d) => [d.keyName, d]));
    return KEY_CATALOG.map((c) => {
      const d = byName.get(c.keyName);
      return {
        keyName: c.keyName,
        provider: c.provider,
        label: c.label,
        purpose: c.purpose,
        url: c.url,
        enabled: d?.enabled ?? false,
        isSet: isSet(d),
        updatedAt: d?.updatedAt || null,
      };
    });
  },

  async update(keyName, { value, enabled }) {
    const cat = KEY_CATALOG.find((c) => c.keyName === keyName);
    if (!cat) throw new AppError('Unknown key', 404, 'UNKNOWN_KEY');

    const patch = { keyName, provider: cat.provider };
    if (value !== undefined) {
      const trimmed = String(value).trim();
      patch.encryptedValue = encrypt(trimmed);
      if (enabled === undefined) patch.enabled = Boolean(trimmed); // setting a value enables it
    }
    if (enabled !== undefined) patch.enabled = Boolean(enabled);

    const doc = await aiKeyRepository.upsert(keyName, patch);
    return { keyName, provider: cat.provider, enabled: doc.enabled, isSet: isSet(doc) };
  },
};
