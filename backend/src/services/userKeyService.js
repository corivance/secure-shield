import { userApiKeyRepository } from '../repositories/userApiKeyRepository.js';
import { userRepository } from '../repositories/userRepository.js';
import { notificationService } from './notificationService.js';
import { resolveKeyForUser } from './keyService.js';
import { KEY_CATALOG } from './aiKeyService.js';
import { encrypt, decrypt } from '../utils/crypto.js';
import { AppError } from '../utils/AppError.js';

const LLM_KEYS = ['CEREBRAS_API_KEY', 'GROQ_API_KEY', 'OPENROUTER_API_KEY'];

const isSet = (doc) => {
  if (!doc?.encryptedValue) return false;
  try {
    return Boolean(decrypt(doc.encryptedValue));
  } catch {
    return false;
  }
};

export const userKeyService = {
  // Per-user key status (never returns the decrypted value) + whether the user
  // is allowed to use the shared admin key.
  async list(userId) {
    const [docs, user] = await Promise.all([userApiKeyRepository.listByUser(userId), userRepository.findById(userId)]);
    const byName = new Map(docs.map((d) => [d.keyName, d]));
    const keys = KEY_CATALOG.map((c) => {
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
    // Is any LLM provider key resolvable for this user (own, or shared if allowed)?
    let llmAvailable = false;
    let llmVia = null;
    for (const kn of LLM_KEYS) {
      // eslint-disable-next-line no-await-in-loop
      if (await resolveKeyForUser(userId, kn)) {
        llmAvailable = true;
        llmVia = kn;
        break;
      }
    }

    return {
      keys,
      canUseAdminKeys: Boolean(user?.canUseAdminKeys),
      keyAccessRequested: Boolean(user?.keyAccessRequested),
      llmAvailable,
      llmVia,
    };
  },

  // Ask the super-admins to set up / share a key — delivered via notifications.
  async requestAccess(userId, message) {
    const user = await userRepository.findById(userId);
    if (!user) throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    if (user.canUseAdminKeys) return { requested: false, alreadyGranted: true };

    await userRepository.updateProfile(userId, { keyAccessRequested: true });

    const admins = await userRepository.findByRole('super-admin');
    const note = String(message || '').trim().slice(0, 300);
    await Promise.all(
      admins.map((a) =>
        notificationService.emit({
          userId: a._id,
          type: 'request',
          title: 'AI key access request',
          body: `${user.fullName} (${user.email}) is requesting access to a shared LLM key${note ? `: “${note}”` : '.'}`,
          link: '/admin/users',
        })
      )
    );
    return { requested: true };
  },

  async update(userId, keyName, { value, enabled }) {
    const cat = KEY_CATALOG.find((c) => c.keyName === keyName);
    if (!cat) throw new AppError('Unknown key', 404, 'UNKNOWN_KEY');

    const patch = { provider: cat.provider };
    if (value !== undefined) {
      const trimmed = String(value).trim();
      patch.encryptedValue = encrypt(trimmed);
      if (enabled === undefined) patch.enabled = Boolean(trimmed);
    }
    if (enabled !== undefined) patch.enabled = Boolean(enabled);

    const doc = await userApiKeyRepository.upsert(userId, keyName, patch);
    return { keyName, provider: cat.provider, enabled: doc.enabled, isSet: isSet(doc) };
  },
};
